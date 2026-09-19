/**
 * Adds up amounts of money.
 *
 * The amounts have two decimal places, so adding them up as floating point
 * numbers introduces rounding errors, which would show up as stray cents in the
 * sums offered to the user. Summing the amounts in whole cents avoids them
 * entirely.
 *
 * @param amounts - The amounts to add up
 * @returns The sum of the amounts
 */
export function currencySum(...amounts: (number | null | undefined)[]): number {
	return amounts.reduce<number>(
		(sum, amount) => sum + Math.round((amount ?? 0) * 100),
		0,
	) / 100
}
