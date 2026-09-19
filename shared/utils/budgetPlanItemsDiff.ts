/** How a title of a budget plan is affected by a change applied for. */
export type BudgetPlanItemChange = 'added' | 'changed' | 'removed' | 'unchanged'

/** The fields of a title that a change can differ in. */
export type BudgetPlanItemField = 'ord' | 'title' | 'description' | 'revenues' | 'expenses'

/** A title of a budget plan, as it stands or as it is applied for. */
export interface BudgetPlanItemDiffItem {
	id?: string | symbol | null
	ord: number | null
	title: string
	description: string | null
	revenues?: number | null
	expenses?: number | null
}

// A type alias rather than an interface, so that it keeps the implicit index
// signature the table component asks of the rows it renders.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type BudgetPlanItemDiffEntry = {
	change: BudgetPlanItemChange
	/** The title as it stands today, `null` for one that is applied for anew. */
	previous: BudgetPlanItemDiffItem | null
	/** The title as it is applied for, `null` for one that is dropped. */
	current: BudgetPlanItemDiffItem | null
	/** Which of the fields differ, empty unless the entry is changed. */
	fields: BudgetPlanItemField[]
}

/**
 * Compares two amounts of money.
 *
 * The amounts have two decimal places, so comparing them as floating point
 * numbers would report a difference where the notation of a value merely
 * differs. Comparing them in whole cents avoids that.
 *
 * @param left - The one amount, an absent one counting as zero
 * @param right - The other amount
 * @returns Whether the two amounts are equal
 */
function sameAmount(left: number | null | undefined, right: number | null | undefined): boolean {
	return Math.round((left ?? 0) * 100) === Math.round((right ?? 0) * 100)
}

/**
 * Lists the fields two versions of a title differ in.
 *
 * @param previous - The title as it stands today
 * @param current - The title as it is applied for
 * @returns The fields that differ, in the order they are rendered in
 */
function changedFields(
	previous: BudgetPlanItemDiffItem,
	current: BudgetPlanItemDiffItem,
): BudgetPlanItemField[] {
	const fields: BudgetPlanItemField[] = []
	if(previous.ord !== current.ord) fields.push('ord')
	if(previous.title !== current.title) fields.push('title')
	if((previous.description ?? '') !== (current.description ?? '')) fields.push('description')
	if(!sameAmount(previous.revenues, current.revenues)) fields.push('revenues')
	if(!sameAmount(previous.expenses, current.expenses)) fields.push('expenses')
	return fields
}

/**
 * Compares the titles of a budget plan with the titles a change applies for.
 *
 * Titles are matched by their id, the same way the change is later written to
 * the database: a title that carries one is changed, one without is added and
 * one that no longer appears is dropped. A title added in the form carries a
 * symbol instead of an id, which never matches an existing one either.
 *
 * @param previous - The titles as they stood when the change was applied for
 * @param current - The titles the change applies for
 * @returns One entry per title, ordered by the ordinal it ends up with
 */
export function budgetPlanItemsDiff(
	previous: readonly BudgetPlanItemDiffItem[],
	current: readonly BudgetPlanItemDiffItem[],
): BudgetPlanItemDiffEntry[] {
	const known = new Map(previous.flatMap((item) =>
		typeof item.id === 'string' ? [ [ item.id, item ] as const ] : []))
	const kept = new Set<string>()

	const entries = current.map<BudgetPlanItemDiffEntry & { sort: number }>((item) => {
		const match = typeof item.id === 'string' ? known.get(item.id) ?? null : null
		if(match) kept.add(match.id as string)

		const fields = match ? changedFields(match, item) : []
		return {
			change: !match ? 'added' : fields.length > 0 ? 'changed' : 'unchanged',
			previous: match,
			current: item,
			fields,
			sort: item.ord ?? 0,
		}
	})

	// A dropped title is shown where the gap it leaves appears, so that a reader
	// finds it next to the titles it used to stand between.
	const dropped = previous
		.filter((item) => typeof item.id !== 'string' || !kept.has(item.id))
		.map<BudgetPlanItemDiffEntry & { sort: number }>((item) => ({
			change: 'removed',
			previous: item,
			current: null,
			fields: [],
			sort: item.ord ?? 0,
		}))

	return [ ...entries, ...dropped ]
		.sort((left, right) => left.sort - right.sort)
		.map(({ sort: _sort, ...entry }) => entry)
}

/**
 * Names how a title is affected by a change, for the motion text and for the
 * screen alike.
 *
 * @param change - How the title is affected
 * @returns The label, empty for a title that stays as it is
 */
export function budgetPlanItemChangeLabel(change: BudgetPlanItemChange): string {
	switch(change) {
		case 'added':
			return 'Neu'
		case 'changed':
			return 'Geändert'
		case 'removed':
			return 'Gestrichen'
		default:
			return ''
	}
}
