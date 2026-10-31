import type z from 'zod'

import { eq, inArray } from 'drizzle-orm'

import type { MutationContext } from './processValidators'

function refuse(statusMessage: string, statusCode = 400, data?: unknown): never {
	throw createError({ statusCode, statusMessage, data })
}

/**
 * Checks a permit for an official journey against the master data and the
 * rules of its workflow, and completes it the way it is stored.
 *
 * The budget follows from the special allocation if one is named, otherwise
 * from the role. A title has to belong to a plan of that budget which is in
 * force when the journey starts. A workflow that names roles or special
 * allocations in its meta data only grants permits for them; naming special
 * allocations makes one of them obligatory.
 *
 * @param tx - The transaction to read in
 * @param data - The permit as submitted
 * @param context - The initiator and the meta data of the mutation
 * @returns The permit with its budget and the sum of its lines
 */
export async function checkTravelPermit(
	tx: ReturnType<typeof useDatabase>,
	data: z.infer<typeof processSchemas.travelPermits.create>,
	context: MutationContext,
) {
	const meta = travelPermitMeta(context.meta)

	const role = await tx.query.travelRoles.findFirst({
		where: eq(travelRoles.id, data.role),
		columns: {
			code: true,
			budget: true,
		},
	})
	if(!role) refuse('Die angegebene Dienstreiserolle wurde nicht gefunden')
	if(meta.roles && !meta.roles.includes(role.code)) {
		refuse('Dieser Workflow genehmigt keine Dienstreisen in dieser Rolle', 403)
	}

	const specialAllocation = data.specialAllocation
		? await tx.query.travelSpecialAllocations.findFirst({
			where: eq(travelSpecialAllocations.id, data.specialAllocation),
			columns: {
				code: true,
				budget: true,
			},
		})
		: null
	if(data.specialAllocation && !specialAllocation) {
		refuse('Die angegebene Haushaltssonderzuweisung wurde nicht gefunden')
	}
	if(meta.specialAllocations && (
		!specialAllocation || !meta.specialAllocations.includes(specialAllocation.code)
	)) {
		refuse('Dieser Workflow genehmigt nur Dienstreisen aus bestimmten ' +
			'Haushaltssonderzuweisungen', 403)
	}

	const budget = specialAllocation?.budget ?? role.budget

	if(data.budgetPlanItem) {
		const item = await tx.query.budgetPlanItems.findFirst({
			where: eq(budgetPlanItems.id, data.budgetPlanItem),
			with: {
				plan: {
					columns: {
						budget: true,
						startDate: true,
						endDate: true,
					},
				},
			},
			columns: {},
		})
		if(!item) refuse('Der angegebene Haushaltstitel wurde nicht gefunden')
		if(item.plan.budget !== budget) {
			refuse('Der Haushaltstitel gehört nicht zum Haushalt der Rolle oder der ' +
				'Haushaltssonderzuweisung')
		}
		// Coerced from a bare date, so the day is the one of UTC midnight.
		const startDate = data.startDate.toISOString().slice(0, 10)
		if(startDate < item.plan.startDate || startDate > item.plan.endDate) {
			refuse('Der Haushaltsplan des Titels gilt zu Reisebeginn nicht')
		}
	}

	await checkBudgetOrigin(tx, { budget }, context)

	const transportMode = await tx.query.travelTransportModes.findFirst({
		where: eq(travelTransportModes.id, data.transportMode),
		columns: {
			reasonRequired: true,
		},
	})
	if(!transportMode) refuse('Das angegebene Verkehrsmittel wurde nicht gefunden')

	if(data.transportReason) {
		const reason = await tx.query.travelTransportReasons.findFirst({
			where: eq(travelTransportReasons.id, data.transportReason),
			columns: {
				transportMode: true,
			},
		})
		if(reason?.transportMode !== data.transportMode) {
			refuse('Der Grund gehört nicht zum gewählten Verkehrsmittel')
		}
	} else if(transportMode.reasonRequired) {
		refuse('Für dieses Verkehrsmittel ist ein Grund anzugeben')
	}

	const costTypeIds = [ ...new Set(data.items.map((item) => item.costType)) ]
	const costTypes = await tx.query.travelCostTypes.findMany({
		where: inArray(travelCostTypes.id, costTypeIds),
		columns: {
			id: true,
			code: true,
		},
	})
	if(costTypes.length !== costTypeIds.length) {
		refuse('Eine der angegebenen Kostenarten wurde nicht gefunden')
	}

	const codes = new Map(costTypes.map((costType) => [ costType.id, costType.code ]))
	const violations = travelPermitViolations(
		data.items.map((item) => ({
			costType: codes.get(item.costType) ?? null,
			amount: item.amount,
		})),
		context.meta,
	)
	if(violations.length > 0) {
		refuse('Die Kostenaufstellung überschreitet einen Höchstbetrag des Workflows', 403, {
			violations,
		})
	}

	return {
		...data,
		budget: data.type === 'reserve' ? budget : null,
		amount: currencySum(...data.items.map((item) => item.amount)),
	}
}
