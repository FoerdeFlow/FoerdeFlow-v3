/** How many days after the end of a journey its costs may be claimed. */
export const travelClaimPeriodDays = 14

/**
 * Formats an entry of the travel master data the way it is offered for choice.
 *
 * @param item - The entry with its code and name
 * @returns `Name (Kürzel)`, or a dash if there is no entry
 */
export function formatTravelCoded(item: { code: string, name: string } | null | undefined): string {
	return item ? `${item.name} (${item.code})` : '–'
}

/** A cap on the sum of all lines of a permit whose cost type is listed. */
export interface TravelPermitLimit {
	costTypes: string[]
	maximumAmount: number
}

export interface TravelPermitMeta {
	/** The most the lines of a permit may add up to. */
	maximumAmount: number | null
	limits: TravelPermitLimit[]
	/** The codes of the roles the workflow grants permits for, `null` for all. */
	roles: string[] | null
	/** The codes of the special allocations it accepts, `null` for all. */
	specialAllocations: string[] | null
}

function readCodes(value: unknown): string[] | null {
	return Array.isArray(value)
		? value.filter((code): code is string => typeof code === 'string')
		: null
}

/**
 * Reads the rules a workflow sets for the permits it grants from the meta data
 * of its mutation. Entries that do not fit the expected shape are ignored.
 *
 * @param meta - The meta data of the mutation
 * @returns The rules, unrestricted where the meta data says nothing
 */
export function travelPermitMeta(meta: unknown): TravelPermitMeta {
	const record = typeof meta === 'object' && meta !== null
		? meta as Record<string, unknown>
		: {}

	const limits = Array.isArray(record.limits)
		? record.limits.flatMap((limit): TravelPermitLimit[] => {
			if(typeof limit !== 'object' || limit === null) return []
			const costTypes = readCodes((limit as Record<string, unknown>).costTypes)
			const maximumAmount = metaAmount(limit, 'maximumAmount')
			return costTypes?.length && maximumAmount !== null
				? [ { costTypes, maximumAmount } ]
				: []
		})
		: []

	return {
		maximumAmount: metaAmount(meta, 'maximumAmount'),
		limits,
		roles: readCodes(record.roles),
		specialAllocations: readCodes(record.specialAllocations),
	}
}

/** A limit of a permit that its lines exceed, with the sum they reach. */
export interface TravelPermitViolation {
	costTypes: string[] | null
	maximumAmount: number
	amount: number
}

/**
 * Checks the lines of a permit against the limits of its workflow.
 *
 * @param items - The lines with the code of their cost type
 * @param meta - The meta data of the mutation
 * @returns Every limit that is exceeded, `costTypes` is `null` for the total
 */
export function travelPermitViolations(
	items: { costType: string | null, amount: number }[],
	meta: unknown,
): TravelPermitViolation[] {
	const { maximumAmount, limits } = travelPermitMeta(meta)

	const total = currencySum(...items.map((item) => item.amount))
	const violations: TravelPermitViolation[] = maximumAmount !== null && total > maximumAmount
		? [ { costTypes: null, maximumAmount, amount: total } ]
		: []

	for(const limit of limits) {
		const amount = currencySum(...items
			.filter((item) => item.costType !== null && limit.costTypes.includes(item.costType))
			.map((item) => item.amount))
		if(amount > limit.maximumAmount) {
			violations.push({ ...limit, amount })
		}
	}

	return violations
}

/**
 * Reads which share of the costs of a permit may be paid in advance. Without
 * the key the advance may reach the costs in full.
 *
 * @param meta - The meta data of the mutation of the advance
 * @returns The share between 0 and 1
 */
export function travelAdvanceRatio(meta: unknown): number {
	const ratio = metaAmount(meta, 'maximumRatio')
	return ratio === null ? 1 : Math.min(ratio, 1)
}

/**
 * Computes the most that may be paid in advance on a permit.
 *
 * @param permitAmount - The costs the permit expects
 * @param meta - The meta data of the mutation of the advance
 * @returns The highest advance, rounded down to the cent
 */
export function travelAdvanceMaximum(permitAmount: number, meta: unknown): number {
	return Math.floor(Math.round(permitAmount * 100) * travelAdvanceRatio(meta)) / 100
}

/**
 * Adds up the costs of a claim. Each line of the permit is reimbursed up to its
 * amount, whatever exceeds it is borne by the traveller.
 *
 * @param permitItems - The lines of the permit with their amounts
 * @param claimItems - The costs that arose, each booked on a line of the permit
 * @returns The costs as claimed and as reimbursed, and both per line
 */
export function travelClaimAmounts(
	permitItems: { id: string, amount: number }[],
	claimItems: { permitItem: string | null, amount: number }[],
) {
	const lines = permitItems.map((item) => {
		const requestedAmount = currencySum(...claimItems
			.filter((claimItem) => claimItem.permitItem === item.id)
			.map((claimItem) => claimItem.amount))
		return {
			permitItem: item.id,
			maximumAmount: item.amount,
			requestedAmount,
			amount: Math.min(requestedAmount, item.amount),
		}
	})

	return {
		lines,
		requestedAmount: currencySum(...lines.map((line) => line.requestedAmount)),
		amount: currencySum(...lines.map((line) => line.amount)),
	}
}

/**
 * Computes the last day the costs of a journey may be claimed on.
 *
 * @param endDate - The day the journey ends, as `YYYY-MM-DD`
 * @returns The last day, as `YYYY-MM-DD`
 */
export function travelClaimDeadline(endDate: string): string {
	const [ year, month, day ] = endDate.split('-').map(Number)
	const deadline = new Date(year ?? 0, (month ?? 1) - 1, (day ?? 1) + travelClaimPeriodDays)
	return serializeDate(deadline) ?? endDate
}

/**
 * Tells whether the costs of a journey may be claimed on a day: only once the
 * journey ended or ends that day, and only within the period after.
 *
 * @param endDate - The day the journey ends, as `YYYY-MM-DD`
 * @param now - The day the claim is made
 * @returns `early` before the end, `late` after the period, `open` otherwise
 */
export function travelClaimWindow(endDate: string, now: Date = new Date()): 'early' | 'open' | 'late' {
	const today = serializeDate(now) ?? ''
	if(today < endDate) return 'early'
	return today > travelClaimDeadline(endDate) ? 'late' : 'open'
}
