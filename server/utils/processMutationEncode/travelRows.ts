import type { ExpandedProcessMutations } from '~~/server/types/expandedProcessMutations'

/** A labelled value, the building block of the travel documents. */
export interface TravelRow {
	key: string
	value: string
}

type TravelPermitEntry = ExpandedProcessMutations['travelPermit']
type TravelClaimEntry = ExpandedProcessMutations['travelClaim']

function permitItemLabel(item: TravelPermitEntry['items'][number]) {
	return [ item.costType?.name ?? '–', item.description ].filter(Boolean).join(': ')
}

/**
 * Describes the journey of a permit and the money it is paid from.
 *
 * @param permit - The permit
 * @returns The rows, in the order a reader expects them
 */
export function travelPermitRows(permit: TravelPermitEntry): TravelRow[] {
	const budget = permit.budgetPlanItem?.plan.budget ?? permit.budget

	return [
		{ key: 'Reisende*r', value: formatPerson(permit.traveler, 'long') || '–' },
		{
			key: 'Rolle',
			value: formatTravelCoded(permit.role) +
				(permit.role ? `, ${permit.role.organizationItem.name}` : ''),
		},
		...permit.specialAllocation
			? [ { key: 'Haushaltssonderzuweisung', value: formatTravelCoded(permit.specialAllocation) } ]
			: [],
		{ key: 'Reise', value: `${permit.origin} – ${permit.destination}` },
		{
			key: 'Zeitraum',
			value: permit.startDate === permit.endDate
				? formatDate(permit.startDate)
				: `${formatDate(permit.startDate)} bis ${formatDate(permit.endDate)}`,
		},
		{
			key: 'Verkehrsmittel',
			value: formatTravelCoded(permit.transportMode) +
				(permit.transportReason ? ` (Grund: ${permit.transportReason.name})` : ''),
		},
		{ key: 'Haushalt', value: formatBudget(budget) || '–' },
		permit.budgetPlanItem
			? {
				key: 'Haushaltstitel',
				value: `${formatBudgetPlanItem(permit.budgetPlanItem)}, ` +
					`Haushaltsperiode ${formatBudgetPlan(permit.budgetPlanItem.plan)}`,
			}
			: { key: 'Herkunft der Mittel', value: 'Rücklage' },
		...permit.description ? [ { key: 'Erläuterung', value: permit.description } ] : [],
	]
}

/**
 * Lists the expected costs of a permit, each with the most that is reimbursed.
 *
 * @param permit - The permit
 * @returns A row per line and one for the total
 */
export function travelPermitCostRows(permit: TravelPermitEntry): TravelRow[] {
	return [
		...permit.items.map((item) => ({
			key: permitItemLabel(item),
			value: formatCurrency(item.amount, 'amount'),
		})),
		{
			key: 'Summe der voraussichtlichen Kosten',
			value: formatCurrency(currencySum(...permit.items.map((item) => item.amount)), 'amount'),
		},
	]
}

/**
 * Lists the costs of a claim by the lines of its permit: what arose, and what
 * of it is reimbursed once each line is capped to its amount.
 *
 * @param claim - The claim, with its permit
 * @returns A row per cost and per line of the permit, then the totals
 */
export function travelClaimCostRows(claim: TravelClaimEntry): TravelRow[] {
	const permitItems = claim.permit?.items ?? []
	const { lines } = travelClaimAmounts(
		permitItems.flatMap((item) => item.id ? [ { id: item.id, amount: item.amount } ] : []),
		claim.items,
	)
	const advance = currencySum(claim.amount, -claim.payoutAmount)

	return [
		...permitItems.flatMap((item) => {
			const line = lines.find((entry) => entry.permitItem === item.id)
			const costs = claim.items.filter((claimItem) => claimItem.permitItem === item.id)
			if(!line || costs.length === 0) return []

			return [
				...costs.map((cost) => ({
					key: permitItemLabel(item) + (cost.description ? ` – ${cost.description}` : ''),
					value: formatCurrency(cost.amount, 'amount'),
				})),
				{
					key: 'davon erstattungsfähig ' +
						`(genehmigt: ${formatCurrency(item.amount, 'amount')})`,
					value: formatCurrency(line.amount, 'amount'),
				},
			]
		}),
		{ key: 'Summe der tatsächlichen Kosten', value: formatCurrency(claim.requestedAmount, 'amount') },
		{ key: 'Summe der erstattungsfähigen Kosten', value: formatCurrency(claim.amount, 'amount') },
		...advance > 0
			? [ { key: 'abzüglich Vorschuss', value: formatCurrency(-advance, 'amount') } ]
			: [],
		claim.payoutAmount < 0
			? { key: 'Rückforderung', value: formatCurrency(-claim.payoutAmount, 'amount') }
			: { key: 'Auszahlungsbetrag', value: formatCurrency(claim.payoutAmount, 'amount') },
	]
}
