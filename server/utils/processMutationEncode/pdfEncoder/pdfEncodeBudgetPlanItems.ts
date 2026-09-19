import { jsPDF } from 'jspdf'

import type { BudgetPlanItemChange, BudgetPlanItemDiffEntry } from '#shared/utils/budgetPlanItemsDiff'

import type { PdfEncoderOptions } from './types'

/**
 * Describes the fields a change touches that have no column of their own, so
 * that a reader of the document sees what a title used to say. The amounts are
 * left out, they stand struck through in the column they belong to.
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

	const values = entry.fields
		.filter((field): field is keyof typeof labels => field in labels)
		.map((field) => labels[field]())
		.join(', ')
	return values ? `bisher: ${values}` : ''
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
 * How a title is drawn, depending on how the change affects it. The style
 * carries the change on its own, so no column has to name it: a title that
 * stays as it is recedes into grey, one that is dropped is struck through in
 * red and one that is added stands out in green.
 */
const changeStyles: Record<BudgetPlanItemChange, {
	color: [ number, number, number ]
	/** The face the title is set in. */
	font: 'normal' | 'bold' | 'italic'
	/** The face the description and the former values are set in. */
	note: 'italic' | 'bolditalic'
	struck: boolean
}> = {
	unchanged: { color: [ 102, 102, 102 ], font: 'italic', note: 'italic', struck: false },
	changed: { color: [ 0, 0, 0 ], font: 'normal', note: 'italic', struck: false },
	removed: { color: [ 179, 38, 30 ], font: 'normal', note: 'italic', struck: true },
	added: { color: [ 27, 127, 59 ], font: 'bold', note: 'bolditalic', struck: false },
}

export async function pdfEncodeBudgetPlanItems(entry: {
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
}, options: PdfEncoderOptions = {}) {
	if(!entry.budget) {
		throw createError({
			status: 500,
			message: 'Invalid budgetPlanItems object (no budget)',
		})
	}

	const budget = `${entry.budget.name} (${entry.budget.code})`
	const period = `${formatDate(entry.plan.startDate, 'compact')} - ` +
		formatDate(entry.plan.endDate, 'compact')

	// eslint-disable-next-line new-cap
	const doc = new jsPDF()
	const docWidth = doc.internal.pageSize.getWidth()
	const docHeight = doc.internal.pageSize.getHeight()
	const pageTop = options.document ? 40 : 30
	const pageBottom = docHeight - 30
	const pos = {
		_y: options.document ? 30 : 20,
		_number: 1,
		get y() {
			return this._y
		},
		set y(value) {
			if(value > pageBottom) {
				if(!options.document) {
					doc.setFont('OpenSans', 'normal')
					doc.setFontSize(14)
					doc.text(
						this._number.toString(),
						docWidth / 2,
						docHeight - 10,
						{ align: 'center' },
					)
				}
				doc.addPage()
				this._number++
				this._y = pageTop

				pdfDrawRunningHeader(
					doc,
					'Nachtragshaushalt',
					[ budget, period ],
					options.document ? 25 : 15,
				)
				return
			}
			this._y = value
		},
		/**
		 * Starts a new page unless the given height still fits on the current one.
		 *
		 * @param height - The height of the block about to be drawn
		 */
		reserve(height: number) {
			if(this._y > pageTop && this._y + height > pageBottom) {
				this.y = docHeight
			}
		},
		finalize() {
			if(!options.document) {
				doc.setFont('OpenSans', 'normal')
				doc.setFontSize(12)
				doc.text(this._number.toString(), docWidth / 2, docHeight - 10, { align: 'center' })
			}
		},
	}

	const logo = await useStorage('assets:server').getItemRaw('img/logo.png')
	const logoProps = doc.getImageProperties(logo)
	const logoHeight = 30
	const logoWidth = logoProps.width / logoProps.height * logoHeight
	doc.addImage(logo, 'PNG', docWidth - logoWidth - 20, pos.y - logoHeight / 2, logoWidth, logoHeight)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(32)
	doc.text('Nachtragshaushalt', 20, pos.y)
	pos.y += 14

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text('Haushalt: ', 20, pos.y)
	pos.y += 8

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(14)
	doc.text(budget, 20, pos.y)
	pos.y += 12

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text('Haushaltsperiode: ', 20, pos.y)
	pos.y += 8

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(14)
	doc.text(period, 20, pos.y)
	pos.y += 12

	/**
	 * Draws a line through a piece of text that was just written, in the colour
	 * that is set for drawing. jsPDF knows no strikethrough of its own.
	 *
	 * @param x - Where the text starts
	 * @param y - The baseline the text sits on
	 * @param width - How wide the text is
	 */
	function strikeThrough(x: number, y: number, width: number) {
		const offset = doc.getFontSize() / doc.internal.scaleFactor * 0.3
		doc.line(x, y - offset, x + width, y - offset)
	}

	// The colours carry the change, so the document says once what they mean.
	doc.setFontSize(10)
	let legendX = 20
	for(const [ change, label ] of [
		[ 'unchanged', 'unverändert' ],
		[ 'changed', 'geändert' ],
		[ 'removed', 'gestrichen' ],
		[ 'added', 'neu' ],
	] as [ BudgetPlanItemChange, string ][]) {
		const legendStyle = changeStyles[change]
		doc.setFont('OpenSans', legendStyle.font)
		doc.setTextColor(legendStyle.color[0], legendStyle.color[1], legendStyle.color[2])
		doc.text(label, legendX, pos.y)

		const labelWidth = doc.getTextWidth(label)
		if(legendStyle.struck) {
			doc.setDrawColor(legendStyle.color[0], legendStyle.color[1], legendStyle.color[2])
			strikeThrough(legendX, pos.y, labelWidth)
			doc.setDrawColor(0)
		}
		legendX += labelWidth + 6
	}
	doc.setTextColor(0)
	pos.y += 16

	// The headings are worthless on their own, so they take the first row along.
	pos.reserve(21)
	doc.rect(10, pos.y - 7, docWidth - 20, 10)
	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text('Einnahmen', 15, pos.y)
	doc.text('Titel', 50, pos.y)
	doc.text('Lfd.', docWidth - 50, pos.y, { align: 'right' })
	doc.text('Ausgaben', docWidth - 15, pos.y, { align: 'right' })
	pos.y += 11

	const textWidth = docWidth - 115
	let category: string | null = null
	for(const diff of budgetPlanItemsDiff(entry.previous.items, entry.items)) {
		// A dropped title is shown as it stood, everything else as it is applied
		// for.
		const item = diff.current ?? diff.previous
		if(!item) continue

		let itemCategory: string | null = null
		let itemTitle = item.title
		if(item.title.includes(' - ')) {
			const [ splitCategory = '', ...rest ] = item.title.split(' - ')
			itemCategory = splitCategory
			itemTitle = rest.join(' - ')
		}
		const categoryChanged = itemCategory !== category

		const style = changeStyles[diff.change]
		const former = formerValues(diff)
		const formerRevenues = formerAmount(diff, 'revenues')
		const formerExpenses = formerAmount(diff, 'expenses')

		doc.setFont('OpenSans', style.font)
		doc.setFontSize(12)
		const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor
		const titleLines = doc.splitTextToSize(itemTitle, textWidth) as string[]
		const titleHeight = titleLines.length * lineHeight

		doc.setFont('OpenSans', style.note)
		doc.setFontSize(10)
		const noteHeight = doc.getLineHeight() / doc.internal.scaleFactor
		const descriptionLines = item.description
			? doc.splitTextToSize(item.description, textWidth) as string[]
			: []
		const descriptionHeight = descriptionLines.length * noteHeight
		const formerHeight = (former
			? (doc.splitTextToSize(former, textWidth) as unknown[]).length
			: 0) * noteHeight
		// The former amounts stand below the ones that take their place, in a
		// column of their own, so they only deepen the row where the text beside
		// them is shorter.
		const amountHeight = formerRevenues || formerExpenses ? noteHeight : 0
		const bodyHeight = Math.max(descriptionHeight + formerHeight, amountHeight)

		// A category heading is measured together with the row it announces, so that
		// the two never end up on different pages.
		const leadHeight = categoryChanged ? (itemCategory === null ? 2 : 10) : 0
		pos.reserve(leadHeight + titleHeight + bodyHeight)

		if(categoryChanged) {
			if(itemCategory === null) {
				pos.y += 2
			} else {
				doc.setFont('OpenSans', 'bold')
				doc.setFontSize(12)
				doc.text(itemCategory, docWidth / 2, pos.y, { align: 'center' })
				pos.y += 10
			}
			category = itemCategory
		}

		doc.rect(10, pos.y - 7, docWidth - 20, titleHeight + bodyHeight + 5)

		doc.setTextColor(style.color[0], style.color[1], style.color[2])
		doc.setDrawColor(style.color[0], style.color[1], style.color[2])

		doc.setFont('OpenSans', style.font)
		doc.setFontSize(12)

		const revenues = formatCurrency(item.revenues ?? 0)
		doc.text(revenues, 42, pos.y, { align: 'right' })
		if(style.struck) {
			strikeThrough(42 - doc.getTextWidth(revenues), pos.y, doc.getTextWidth(revenues))
		}

		doc.text(itemTitle, 50, pos.y, { align: 'justify', maxWidth: textWidth })
		if(style.struck) {
			titleLines.forEach((line, index) => {
				// Every line but the last one is stretched to the full width by the
				// justification, so only the last one has to be measured.
				const width = index === titleLines.length - 1
					? doc.getTextWidth(line)
					: textWidth
				strikeThrough(50, pos.y + index * lineHeight, width)
			})
		}

		if(item.ord) {
			const ord = item.ord.toString()
			doc.text(ord, docWidth - 50, pos.y, { align: 'right' })
			if(style.struck) {
				strikeThrough(docWidth - 50 - doc.getTextWidth(ord), pos.y, doc.getTextWidth(ord))
			}
		}

		const expenses = formatCurrency(item.expenses ?? 0)
		doc.text(expenses, docWidth - 15, pos.y, { align: 'right' })
		if(style.struck) {
			strikeThrough(docWidth - 15 - doc.getTextWidth(expenses), pos.y, doc.getTextWidth(expenses))
		}

		doc.setFont('OpenSans', style.note)
		doc.setFontSize(10)

		if(item.description) {
			doc.text(
				item.description, 50, pos.y + titleHeight,
				{ align: 'justify', maxWidth: textWidth },
			)
			if(style.struck) {
				descriptionLines.forEach((line, index) => {
					const width = index === descriptionLines.length - 1
						? doc.getTextWidth(line)
						: textWidth
					strikeThrough(50, pos.y + titleHeight + index * noteHeight, width)
				})
			}
		}

		if(former) {
			doc.text(
				former, 50, pos.y + titleHeight + descriptionHeight,
				{ align: 'justify', maxWidth: textWidth },
			)
		}

		// An amount that was replaced stands struck through under the one that
		// replaced it, so that the two are read as the one and the other.
		if(formerRevenues) {
			doc.text(formerRevenues, 42, pos.y + titleHeight, { align: 'right' })
			strikeThrough(
				42 - doc.getTextWidth(formerRevenues), pos.y + titleHeight,
				doc.getTextWidth(formerRevenues),
			)
		}

		if(formerExpenses) {
			doc.text(formerExpenses, docWidth - 15, pos.y + titleHeight, { align: 'right' })
			strikeThrough(
				docWidth - 15 - doc.getTextWidth(formerExpenses), pos.y + titleHeight,
				doc.getTextWidth(formerExpenses),
			)
		}

		// Reset before the position moves on: crossing a page boundary draws the
		// running header, which is no part of the row.
		doc.setTextColor(0)
		doc.setDrawColor(0)

		pos.y += titleHeight + bodyHeight + 5
	}

	pos.y += 1
	pos.reserve(3)
	doc.rect(10, pos.y - 7, docWidth - 20, 10)

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(12)
	doc.text(
		formatCurrency(budgetPlanTotal(entry.items, 'revenues')),
		42, pos.y, { align: 'right' },
	)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(12)
	doc.text('Summe Einnahmen/Ausgaben', docWidth / 2, pos.y, { align: 'center' })

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(12)
	doc.text(
		formatCurrency(budgetPlanTotal(entry.items, 'expenses')),
		docWidth - 15, pos.y, { align: 'right' },
	)

	pos.y += 10

	if(options.signature) {
		pdfDrawSignatureBlock(doc, pos, options.signature)
	}

	pos.finalize()
	return doc
}
