import type { ExpandedProcessMutations } from '~~/server/types/expandedProcessMutations'

type TravelPermit = Omit<ExpandedProcessMutations['travelPermit'], 'id'>
type TravelClaim = ExpandedProcessMutations['travelClaim']

export interface TravelRow {
	key: string
	value: string
}

/**
 * Names the budget a permit for official journeys is paid from.
 *
 * @param permit - The permit
 * @returns The budget, and the title and period if it is paid from a plan
 */
export function travelPermitOrigin(permit: TravelPermit) {
	const budget = permit.budgetPlanItem?.plan.budget ?? permit.budget
	if(!budget) {
		throw createError({
			status: 500,
			message: 'Invalid travelPermit object (neither budget nor budgetPlanItem)',
		})
	}
	return budget
}

/**
 * Lists the facts of a permit for official journeys, in the order the html and
 * the PDF encoder show them. The values are plain text.
 *
 * @param permit - The permit
 * @returns The rows to show
 */
export function travelPermitRows(permit: TravelPermit): TravelRow[] {
	const budget = travelPermitOrigin(permit)
	const general = permit.kind === 'general'

	return [
		{ key: 'Art der Genehmigung', value: formatTravelPermitKind(permit.kind) },
		{ key: 'Haushalt', value: formatBudget(budget) },
		...permit.budgetPlanItem
			? [
				{ key: 'Haushaltstitel', value: permit.budgetPlanItem.title },
				{ key: 'Haushaltsperiode', value: formatBudgetPlan(permit.budgetPlanItem.plan) },
			]
			: [ { key: 'Herkunft der Mittel', value: 'Rücklage' } ],
		{ key: 'Reiseziel', value: `${permit.destination}${permit.domestic ? '' : ' (Ausland)'}` },
		{
			key: general ? 'Gültigkeitszeitraum' : 'Reisezeitraum',
			value: formatBudgetPlan({ startDate: permit.startDate, endDate: permit.endDate }),
		},
		{ key: 'Anlass', value: formatTravelPermitOccasion(permit.occasion) },
		{ key: 'Personenkreis (§ 1)', value: formatTravelPermitTravelerBasis(permit.travelerBasis) },
		{
			key: 'Besonderes Interesse (§ 2 Abs. 2)',
			value: formatTravelPermitSpecialInterest(permit.specialInterest) +
				(permit.specialInterestReference ? ` (${permit.specialInterestReference})` : ''),
		},
		{ key: 'Fernverkehr (§ 6 Abs. 2)', value: permit.longDistance ? 'Ja' : 'Nein' },
		{ key: 'Kraftfahrzeug (§ 6 Abs. 3)', value: formatTravelPermitCar(permit.car) },
		...permit.car === 'none'
			? []
			: [
				{ key: 'Erhebliches dienstliches Interesse', value: permit.carInterestReason ?? '' },
				{
					key: 'Parkgebühren erstattungsfähig',
					value: permit.parkingFeesAllowed ? 'Ja' : 'Nein',
				},
			],
		...permit.car === 'carsharing'
			? [ {
				key: 'Geschätzte Carsharing-Kosten (Sammelrechnung)',
				value: formatCurrency(permit.carsharingEstimate ?? 0, 'amount'),
			} ]
			: [],
		...permit.advanceAmount
			? [ { key: 'Vorschuss (§ 9)', value: formatCurrency(permit.advanceAmount, 'amount') } ]
			: [],
		...permit.description ? [ { key: 'Beschreibung', value: permit.description } ] : [],
	]
}

/**
 * Lists the travellers of a permit with their approved costs.
 *
 * @param permit - The permit
 * @returns The rows to show
 */
export function travelPermitTravelerRows(permit: TravelPermit): TravelRow[] {
	return permit.travelers.map((traveler) => ({
		key: formatPerson(traveler.person, 'long') + (traveler.driver ? ' (fahrend)' : ''),
		value: formatCurrency(traveler.amount, 'amount'),
	}))
}

/**
 * Lists the facts of a claim for the costs of an official journey.
 *
 * @param claim - The claim
 * @returns The rows to show
 */
export function travelClaimRows(claim: TravelClaim): TravelRow[] {
	return [
		...claim.title ? [ { key: 'Dienstgeschäft', value: claim.title } ] : [],
		...claim.destination ? [ { key: 'Reiseziel', value: claim.destination } ] : [],
		{
			key: 'Reisezeitraum',
			value: formatBudgetPlan({ startDate: claim.startDate, endDate: claim.endDate }),
		},
		{ key: 'Erstattung an', value: formatPerson(claim.recipientPerson, 'long') },
		...claim.late
			? [ { key: 'Hinweis', value: 'Der Antrag wurde nach Ablauf der Frist des § 4 gestellt.' } ]
			: [],
	]
}

/**
 * Lists the items of a claim.
 *
 * @param claim - The claim
 * @returns The rows to show, one per item
 */
export function travelClaimItemRows(claim: TravelClaim): TravelRow[] {
	return claim.items.map((item) => ({
		key: [
			formatPerson(item.traveler),
			formatTravelClaimItemCategory(item.category),
			item.description,
			...item.kilometers ? [ `${item.kilometers} km` ] : [],
			...item.event ? [ item.event ] : [],
		].join(' · '),
		value: formatCurrency(item.amount, 'amount'),
	}))
}

/**
 * Lists the totals of a claim: the costs, the advance and what is paid out.
 *
 * @param claim - The claim
 * @returns The rows to show
 */
export function travelClaimTotalRows(claim: TravelClaim): TravelRow[] {
	return [
		{ key: 'Erstattungsfähige Kosten', value: formatCurrency(claim.amount, 'amount') },
		...claim.advanceAmount
			? [
				{ key: 'Abzüglich Vorschuss', value: formatCurrency(claim.advanceAmount, 'amount') },
				{
					key: claim.payoutAmount < 0 ? 'Zurückzuzahlen' : 'Auszuzahlen',
					value: formatCurrency(Math.abs(claim.payoutAmount), 'amount'),
				},
			]
			: [],
	]
}
