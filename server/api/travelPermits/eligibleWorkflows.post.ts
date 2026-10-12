import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'
import z from 'zod'

/**
 * Tells for every workflow that grants permits for official journeys whether
 * it is responsible for a journey, so that the applicant is offered the right
 * body (§ 3 DiReiseR). The same checks run once more when the process is
 * created, this only spares a refusal.
 */
export default defineEventHandler(async (event) => {
	if(!(event.context as EventContext).user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
		})
	}

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		kind: z.enum([ 'single', 'general' ]),
		domestic: z.boolean(),
		startDate: z.coerce.date(),
		occasion: z.enum([ 'parliamentSession', 'other' ]),
		travelerBasis: z.enum([
			'officeHolder',
			'employee',
			'commissioned',
			'sports',
			'recognizedMember',
		]),
		specialInterest: z.enum([
			'none',
			'campusTravel',
			'centralBodySession',
			'vehicleCosts',
			'parliamentDecision',
		]),
		car: z.enum([ 'none', 'private', 'carsharing' ]),
		carsharingEstimate: z.number().nonnegative().nullable(),
		initiatorOrganizationItem: idSchema.nullable(),
		travelers: z.array(z.strictObject({
			person: idSchema,
			amount: z.number().nonnegative(),
		})).min(1),
	}).parseAsync(data))

	const database = useDatabase()

	const mutations = await database.query.workflowMutations.findMany({
		where: eq(workflowMutations.table, 'travelPermits'),
		with: {
			workflow: true,
		},
	})

	return await Promise.all(mutations.map(async (mutation) => {
		const rules = travelMeta(mutation.meta)
		const context = {
			initiatorType: body.initiatorOrganizationItem
				? 'organizationItem' as const
				: 'person' as const,
			initiatorOrganizationItem: body.initiatorOrganizationItem,
			meta: mutation.meta,
		}

		const reasons: string[] = []
		if(!rules.permitKinds.includes(body.kind)) {
			reasons.push(body.kind === 'general'
				? 'Keine generellen Genehmigungen'
				: 'Nur generelle Genehmigungen')
		}
		if(rules.domesticOnly && !body.domestic) {
			reasons.push('Nur Dienstreisen im Inland')
		}
		if(!await travelPermitEligible(body, context)) {
			reasons.push('Nicht zuständig für diesen Personenkreis oder Anlass')
		}
		const limits = travelPermitLimits({ ...body, advanceAmount: null }, mutation.meta)
		if(limits.aboveLimit.length > 0) {
			reasons.push(`Höchstens ${formatCurrency(rules.maximumAmountPerPerson, 'amount')} je Person`)
		}

		return {
			workflow: {
				id: mutation.workflow.id,
				code: mutation.workflow.code,
				name: mutation.workflow.name,
				description: mutation.workflow.description,
			},
			maximumAmountPerPerson: rules.maximumAmountPerPerson,
			domesticOnly: rules.domesticOnly,
			eligible: reasons.length === 0,
			reasons,
		}
	}))
})
