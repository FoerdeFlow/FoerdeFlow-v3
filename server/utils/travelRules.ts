import type z from 'zod'

import { and, eq, inArray, ne, sql } from 'drizzle-orm'

import type { MutationContext } from './processValidators'

interface TravelPermitVariants {
	type?: 'planned' | 'reserve' | null
	budgetPlanItem?: string | null
	budget?: string | null
	kind?: 'single' | 'general' | null
	specialInterest?: string | null
	specialInterestReference?: string | null
	car?: 'none' | 'private' | 'carsharing' | null
	carInterestReason?: string | null
	parkingFeesAllowed?: boolean | null
	carsharingEstimate?: number | null
	advanceAmount?: number | null
}

/**
 * Checks that a permit carries exactly the fields its choices call for, so that
 * a wrong combination is refused as invalid input instead of running into the
 * check constraints of the table.
 *
 * @param permit - The permit to check
 * @returns Whether the fields match the choices
 */
export function travelPermitVariantsValid(permit: TravelPermitVariants) {
	const type = permit.type ?? 'planned'
	const originValid = type === 'planned'
		? !!permit.budgetPlanItem && !permit.budget
		: !!permit.budget && !permit.budgetPlanItem

	const referenceValid = permit.specialInterest !== 'parliamentDecision' ||
		!!permit.specialInterestReference

	const car = permit.car ?? 'none'
	const carValid = (car === 'none') === !permit.carInterestReason &&
		(car !== 'none' || !permit.parkingFeesAllowed) &&
		(car === 'carsharing' || permit.carsharingEstimate === null ||
			permit.carsharingEstimate === undefined)

	const advanceValid = !permit.advanceAmount || permit.kind !== 'general'

	return originValid && referenceValid && carValid && advanceValid
}

/**
 * Names the attachment a receipt of a claim is stored as.
 *
 * @param ord - The ordinal of the item the receipt belongs to
 * @param index - The position of the receipt among those of the item
 * @returns The name of the attachment
 */
export function travelClaimReceiptName(ord: number, index: number) {
	return `receipt_${ord}_${index}`
}

/**
 * Checks whether every traveller of a permit is a member of an organization
 * item at the start of the journey.
 *
 * @param organizationItem - The organization item
 * @param persons - The travellers
 * @param date - The day the membership has to hold on
 * @returns Whether all of them are members
 */
async function allMembersOf(organizationItem: string, persons: string[], date: Date) {
	const members = new Set((await getEffectiveMembers([ organizationItem ], null, date))
		.map((member) => member.id))
	return persons.every((person) => members.has(person))
}

/**
 * Checks whether a condition of the meta data holds for a journey.
 *
 * @param condition - The condition
 * @param permit - The facts of the journey
 * @param initiatorOrganizationItem - The organization item the process is
 * started for, if any
 * @returns Whether the condition holds
 */
async function travelConditionHolds(
	condition: TravelEligibility,
	permit: {
		startDate: Date
		occasion: TravelPermitOccasion
		travelerBasis: TravelPermitTravelerBasis
		specialInterest: TravelPermitSpecialInterest
		travelers: { person: string }[]
	},
	initiatorOrganizationItem: string | null,
) {
	if('specialInterest' in condition) {
		return condition.specialInterest === (permit.specialInterest !== 'none')
	}
	if('occasion' in condition) {
		return condition.occasion === permit.occasion
	}
	if('travelerBasis' in condition) {
		return condition.travelerBasis === permit.travelerBasis
	}

	const organizationItem = condition.membershipOf === 'initiator'
		? initiatorOrganizationItem
		: condition.membershipOf
	return !!organizationItem && await allMembersOf(
		organizationItem,
		permit.travelers.map((traveler) => traveler.person),
		permit.startDate,
	)
}

/**
 * Checks whether a workflow is responsible for a journey (§ 3 DiReiseR).
 *
 * Without conditions a workflow is responsible for every journey, otherwise
 * one of its conditions has to hold. A single condition the workflow excludes
 * makes it not responsible, whatever else holds: a board of a student council
 * may for instance not grant a journey a special interest was established for.
 *
 * @param permit - The facts of the journey
 * @param context - The initiator and the meta data of the mutation
 * @returns Whether the workflow may grant the permit
 */
export async function travelPermitEligible(
	permit: {
		startDate: Date
		occasion: TravelPermitOccasion
		travelerBasis: TravelPermitTravelerBasis
		specialInterest: TravelPermitSpecialInterest
		travelers: { person: string }[]
	},
	context: Omit<MutationContext, 'initiatorPerson'>,
) {
	const { eligibleIf, excludeIf } = travelMeta(context.meta)

	for(const condition of excludeIf) {
		if(await travelConditionHolds(condition, permit, context.initiatorOrganizationItem)) {
			return false
		}
	}

	if(eligibleIf.length === 0) return true
	for(const condition of eligibleIf) {
		if(await travelConditionHolds(condition, permit, context.initiatorOrganizationItem)) {
			return true
		}
	}
	return false
}

/**
 * Checks a permit against the rules of the regulation and of its workflow.
 *
 * @param tx - The transaction to read in
 * @param data - The permit as it was applied for
 * @param context - The initiator and the meta data of the mutation
 * @throws When the permit breaks one of the rules
 */
export async function checkTravelPermit(
	tx: ReturnType<typeof useDatabase>,
	data: z.infer<typeof processSchemas.travelPermits.create>,
	context: MutationContext,
) {
	const rules = travelMeta(context.meta)

	if(!rules.permitKinds.includes(data.kind)) {
		throw createError({
			statusCode: 403,
			statusMessage: data.kind === 'general'
				? 'Über diesen Workflow kann keine generelle Dienstreisegenehmigung erteilt werden'
				: 'Über diesen Workflow kann nur eine generelle Dienstreisegenehmigung erteilt werden',
		})
	}

	if(rules.domesticOnly && !data.domestic) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Über diesen Workflow können nur Dienstreisen im Inland genehmigt werden',
		})
	}

	if(!await travelPermitEligible(data, context)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Für diese Dienstreise ist eine andere Stelle zuständig',
		})
	}

	const limits = travelPermitLimits(data, context.meta)
	if(limits.aboveLimit.length > 0) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Der Höchstbetrag je Person wird überschritten',
			data: {
				maximumPerPerson: limits.limit,
				amounts: limits.aboveLimit.map((entry) => entry.amount),
			},
		})
	}
	if(limits.advanceInvalid) {
		throw createError({
			statusCode: 403,
			statusMessage: limits.advanceAllowed
				? 'Der Vorschuss übersteigt den zulässigen Anteil der Kosten'
				: 'Ein Vorschuss ist erst bei Kosten über ' +
					`${formatCurrency(rules.advanceMinimumBase, 'amount')} möglich`,
			data: { maximumAdvance: limits.maximumAdvance },
		})
	}

	// § 7 Absatz 2: only those who proved their licence and were instructed
	// may drive the cars of the student body.
	if(data.car === 'carsharing') {
		const drivers = data.travelers.filter((traveler) => traveler.driver)
		if(drivers.length === 0) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Für ein dienstliches Fahrzeug ist mindestens eine fahrende Person ' +
					'anzugeben',
			})
		}

		const qualified = await tx.query.vehicleDriverQualifications.findMany({
			where: inArray(
				vehicleDriverQualifications.person,
				drivers.map((driver) => driver.person),
			),
			columns: {
				person: true,
				instructedAt: true,
			},
		})
		const allowed = new Set(qualified
			.filter((entry) => entry.instructedAt !== null)
			.map((entry) => entry.person))
		const missing = drivers.filter((driver) => !allowed.has(driver.person))
		if(missing.length > 0) {
			throw createError({
				statusCode: 403,
				statusMessage: 'Nicht alle fahrenden Personen sind zur Nutzung der dienstlichen ' +
					'Fahrzeuge berechtigt',
				data: { persons: missing.map((driver) => driver.person) },
			})
		}
	}
}

/**
 * Counts the claims that are made on a permit, both those that were approved
 * and those that are still being decided on.
 *
 * @param tx - The transaction to read in
 * @param permit - The permit
 * @param exclude - The process whose claim is not to be counted
 * @returns The number of claims
 */
async function countTravelClaims(
	tx: ReturnType<typeof useDatabase>,
	permit: string,
	exclude: string | null,
) {
	const [ approved ] = await tx
		.select({ count: sql<number>`count(*)::int` })
		.from(travelClaims)
		.where(eq(travelClaims.permit, permit))

	const [ pending ] = await tx
		.select({ count: sql<number>`count(*)::int` })
		.from(workflowProcessMutations)
		.innerJoin(workflowMutations, eq(workflowMutations.id, workflowProcessMutations.mutation))
		.innerJoin(workflowProcesses, eq(workflowProcesses.id, workflowProcessMutations.process))
		.where(and(
			eq(workflowMutations.table, 'travelClaims'),
			eq(workflowProcesses.status, 'pending'),
			sql`${workflowProcessMutations.data}->>'permit' = ${permit}`,
			// A claim that is being corrected does not stand in its own way.
			...exclude ? [ ne(workflowProcesses.id, exclude) ] : [],
		))

	return (approved?.count ?? 0) + (pending?.count ?? 0)
}

/**
 * Checks a claim against its permit and the rules of the regulation, and adds
 * what follows from them: the amounts of journeys by private car, the advance
 * that is set off and whether the claim is late.
 *
 * @param tx - The transaction to read in
 * @param data - The claim as it was handed in
 * @param context - The initiator and the meta data of the mutation
 * @returns The claim with the derived fields
 * @throws When the claim breaks one of the rules
 */
export async function checkTravelClaim(
	tx: ReturnType<typeof useDatabase>,
	data: z.infer<typeof processSchemas.travelClaims.create>,
	context: MutationContext,
) {
	const rules = travelMeta(context.meta)

	const permit = await tx.query.travelPermits.findFirst({
		where: eq(travelPermits.id, data.permit),
		with: {
			travelers: {
				columns: {
					person: true,
					amount: true,
				},
			},
		},
	})
	if(!permit) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Die Dienstreisegenehmigung wurde nicht gefunden',
			data: { permitId: data.permit },
		})
	}

	const travelers = new Set(permit.travelers.map((traveler) => traveler.person))
	if(context.initiatorType === 'person' && !travelers.has(context.initiatorPerson ?? '')) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Die Erstattung kann nur von einer reisenden Person beantragt werden',
		})
	}
	if(!travelers.has(data.recipientPerson)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Die Erstattung kann nur an eine reisende Person ausgezahlt werden',
		})
	}
	const foreign = data.items.find((item) => !travelers.has(item.traveler))
	if(foreign) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Eine Position betrifft eine Person, die nicht zu den Reisenden gehört',
			data: { ord: foreign.ord },
		})
	}

	const general = permit.kind === 'general'
	if(general !== (!!data.title && !!data.destination)) {
		throw createError({
			statusCode: 400,
			statusMessage: general
				? 'Unter einer generellen Genehmigung sind Anlass und Ziel der Reise anzugeben'
				: 'Anlass und Ziel der Reise stehen bereits in der Genehmigung',
		})
	}

	const startDate = new Date(permit.startDate)
	const endDate = new Date(permit.endDate)
	endDate.setHours(23, 59, 59, 999)
	if(data.startDate < startDate || data.endDate > endDate) {
		throw createError({
			statusCode: 400,
			statusMessage: general
				? 'Die Reise liegt außerhalb des Gültigkeitszeitraums der Genehmigung'
				: 'Die Reise liegt außerhalb des genehmigten Zeitraums',
		})
	}

	// A permit for a single journey is settled by a single claim, which is what
	// lets the advance and the approved costs be set off against it.
	if(!general && await countTravelClaims(tx, permit.id, context.process ?? null) > 0) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Zu dieser Dienstreisegenehmigung wurde bereits eine Erstattung beantragt',
		})
	}

	const forbidden = data.items.find((item) => !travelClaimCategoryAllowed(item.category, permit))
	if(forbidden) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Diese Kostenart ist durch die Genehmigung nicht gedeckt',
			data: { ord: forbidden.ord, category: forbidden.category },
		})
	}

	const items = data.items.map((item) => item.category === 'privateCar' && item.kilometers
		? { ...item, amount: travelKilometerAmount(item.kilometers, rules.kilometerRate) }
		: item)

	const approved = Object.fromEntries(permit.travelers
		.map((traveler) => [ traveler.person, traveler.amount ]))
	const limits = travelClaimLimits(items, approved, context.meta)
	const [ event ] = limits.eventsAboveLimit
	if(event) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Tagungsgelder und Fortbildungskosten übersteigen ' +
				`${formatCurrency(rules.maximumEventAmountPerPerson, 'amount')} je Person ` +
				'und Veranstaltung',
			data: event,
		})
	}
	const [ person ] = limits.personsAboveApproval
	if(person) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Die Kosten übersteigen den genehmigten Betrag',
			data: person,
		})
	}

	const advanceAmount = general ? null : permit.advanceAmount
	return {
		...data,
		items,
		amount: limits.total,
		advanceAmount,
		payoutAmount: currencySum(limits.total, -(advanceAmount ?? 0)),
		late: travelClaimLate(data.endDate, rules.claimDeadlineDays, context.now ?? new Date()),
	}
}
