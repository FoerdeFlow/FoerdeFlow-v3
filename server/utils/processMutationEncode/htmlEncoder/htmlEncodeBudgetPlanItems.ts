import type { BudgetPlanItemChange, BudgetPlanItemDiffEntry } from '#shared/utils/budgetPlanItemsDiff'

/**
 * Splits the title of a budget plan item into the category it belongs to and
 * the title within that category. Categories are written into the title
 * separated by a dash, the same convention the rendering of a plan reads.
 *
 * @param title - The title of the item
 * @returns The category, or `null` if the item carries none, and the title
 */
function splitItemTitle(title: string): [ string | null, string ] {
	const [ category, ...rest ] = title.split(' - ')
	if(category === undefined || rest.length === 0) return [ null, title ]
	return [ category, rest.join(' - ') ]
}

/**
 * Describes the fields a change touches that have no column of their own, so
 * that a reader sees what a title used to say. The amounts are left out, they
 * stand struck through in the column they belong to.
 *
 * @param entry - The entry of the comparison
 * @returns The former values of the changed fields, empty if there are none
 */
function formerValues(entry: BudgetPlanItemDiffEntry): string {
	const previous = entry.previous
	if(!previous) return ''

	const labels = {
		ord: () => `laufende Nummer ${previous.ord ?? '–'}`,
		title: () => `Bezeichnung „${previous.title}“`,
		description: () => `Erläuterung „${previous.description ?? '–'}“`,
	}

	return entry.fields
		.filter((field): field is keyof typeof labels => field in labels)
		.map((field) => labels[field]())
		.join(', ')
}

/**
 * The amount a title used to carry, for the column it stands in.
 *
 * @param entry - The entry of the comparison
 * @param field - The amount to read
 * @returns The former amount or an empty string if it did not change
 */
function formerAmount(entry: BudgetPlanItemDiffEntry, field: 'revenues' | 'expenses'): string {
	if(!entry.previous || !entry.fields.includes(field)) return ''
	return formatCurrency(entry.previous[field] ?? 0, 'amount')
}

/**
 * Renders the former amount below the one a title carries from now on.
 *
 * @param value - The former amount, empty where it did not change
 * @returns The markup to append to the cell
 */
function formerAmountCell(value: string): string {
	if(!value) return ''
	return '<br /><span style="font-size: 0.8em; text-decoration: line-through">' +
		`${escapeHtml(value)}</span>`
}

/**
 * How a title is shown, depending on how the change affects it. The style
 * carries the change on its own, so no column has to name it: a title that
 * stays as it is recedes into grey, one that is dropped is struck through in
 * red and one that is added stands out in green.
 */
const changeStyles: Record<BudgetPlanItemChange, string> = {
	unchanged: 'color: #666666; font-style: italic;',
	changed: '',
	removed: 'color: #b3261e; text-decoration: line-through;',
	added: 'color: #1b7f3b; font-weight: bold;',
}

export function htmlEncodeBudgetPlanItems(entry: {
	id?: string
	budget: {
		name: string
		code: string
	} | null
	plan: {
		startDate: string
		endDate: string
	}
	items: {
		id?: string | null
		ord: number | null
		title: string
		description: string | null
		revenues?: number | null
		expenses?: number | null
	}[]
	previous: {
		items: {
			id: string
			ord: number | null
			title: string
			description: string | null
			revenues?: number | null
			expenses?: number | null
		}[]
	}
}) {
	if(!entry.budget) {
		throw createError({
			status: 500,
			message: 'Invalid budgetPlanItems object (no budget)',
		})
	}

	const revenues = budgetPlanTotal(entry.items, 'revenues')
	const expenses = budgetPlanTotal(entry.items, 'expenses')

	const motionText = '<p>' +
		`Der Haushaltsplan des Haushalts ${escapeHtml(formatBudget(entry.budget))} ` +
		`für die Haushaltsperiode ${formatBudgetPlan(entry.plan)} ` +
		'wird wie folgt geändert. Er weist danach Einnahmen in Höhe von ' +
		`${formatCurrency(revenues, 'amount')} und Ausgaben in Höhe von ` +
		`${formatCurrency(expenses, 'amount')} aus.` +
		'</p>'

	let category: string | null = null
	const detailsText = '<h3>Haushaltstitel</h3>' +
		'<table>' +
		'<thead>' +
		'<tr>' +
		'<th>Lfd.</th>' +
		'<th>Bezeichnung</th>' +
		'<th>Einnahmen</th>' +
		'<th>Ausgaben</th>' +
		'</tr>' +
		'</thead>' +
		'<tbody>' +
		budgetPlanItemsDiff(entry.previous.items, entry.items).map((diff) => {
			// A dropped title is shown as it stood, everything else as it is
			// applied for.
			const item = diff.current ?? diff.previous
			if(!item) return ''

			const [ itemCategory, itemTitle ] = splitItemTitle(item.title)
			const categoryRow = itemCategory !== null && itemCategory !== category
				? `<tr><th colspan="4">${escapeHtml(itemCategory)}</th></tr>`
				: ''
			category = itemCategory

			const style = changeStyles[diff.change]
			const cell = style ? ` style="${style}"` : ''
			const former = formerValues(diff)

			return categoryRow +
				'<tr>' +
				`<td${cell}>${item.ord ?? ''}</td>` +
				`<td${cell}>` +
					`${escapeHtml(itemTitle)}<br />` +
					`<span style="font-size: 0.8em">${escapeHtml(item.description ?? '')}</span>` +
					(former
						? '<br /><span style="font-size: 0.8em">' +
							`bisher: ${escapeHtml(former)}</span>`
						: '') +
				'</td>' +
				`<td${cell}>${formatCurrency(item.revenues ?? 0)}` +
					`${formerAmountCell(formerAmount(diff, 'revenues'))}</td>` +
				`<td${cell}>${formatCurrency(item.expenses ?? 0)}` +
					`${formerAmountCell(formerAmount(diff, 'expenses'))}</td>` +
				'</tr>'
		}).join('') +
		// Die Summenzeile steht im `tbody`, da OpenSlides `tfoot` nicht
		// erlaubt und das Tag sonst als Klartext ausgibt.
		'<tr>' +
		'<th></th>' +
		'<th>Summe Einnahmen/Ausgaben</th>' +
		`<th>${formatCurrency(revenues, 'amount')}</th>` +
		`<th>${formatCurrency(expenses, 'amount')}</th>` +
		'</tr>' +
		'</tbody>' +
		'</table>'

	return motionText + detailsText
}
