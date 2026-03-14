import { jsPDF } from 'jspdf'

export async function pdfEncodeExpenseAuthorization(entry: {
	id?: string
	budgetPlanItem: {
		title: string
		plan: {
			budget: {
				name: string
				code: string
			}
			startDate: string
			endDate: string
		}
	}
	title: string
	description: string | null
	items: {
		title: string
		description: string | null
		amount: number
		ord: number | null
	}[]
}, options: {
	document?: boolean
} = {}) {
	const budget = [
		entry.budgetPlanItem.plan.budget.name,
		`(${entry.budgetPlanItem.plan.budget.code})`,
	].join(' ')
	const title = entry.title
	const period = [
		formatDate(entry.budgetPlanItem.plan.startDate, 'compact'),
		formatDate(entry.budgetPlanItem.plan.endDate, 'compact'),
	].join(' - ')

	// eslint-disable-next-line new-cap
	const doc = new jsPDF()
	const docWidth = doc.internal.pageSize.getWidth()
	const docHeight = doc.internal.pageSize.getHeight()
	const pos = {
		_y: options.document ? 30 : 20,
		_number: 1,
		get y() {
			return this._y
		},
		set y(value) {
			if (value > docHeight - 30) {
				if (!options.document) {
					doc.setFont('OpenSans', 'normal')
					doc.setFontSize(14)
					doc.text(this._number.toString(), docWidth / 2, docHeight - 10, { align: 'center' })
				}
				doc.addPage()
				this._number++
				this._y = options.document ? 40 : 30

				doc.setFont('OpenSans', 'italic')
				doc.setFontSize(14)
				doc.text('Ausgabeermächtigung', 20, options.document ? 25 : 15, { align: 'left' })
				doc.text(`${title} | ${period}`, docWidth - 20, options.document ? 25 : 15, { align: 'right' })
				return
			}
			this._y = value
		},
		finalize() {
			if (!options.document) {
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
	doc.setFontSize(24)
	doc.text('Ausgabeermächtigung', 20, pos.y)
	pos.y += 10

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(18)
	doc.text(entry.title, 20, pos.y)
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
	doc.text('Haushaltstitel: ', 20, pos.y)
	pos.y += 8

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(14)
	doc.text(entry.budgetPlanItem.title, 20, pos.y)
	pos.y += 12

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text('Haushaltsperiode: ', 20, pos.y)
	pos.y += 8

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(14)
	doc.text(period, 20, pos.y)
	pos.y += 15

	if (entry.description) {
		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		const descriptionHeight =
			(doc.splitTextToSize(entry.description, docWidth - 40) as unknown[]).length *
			doc.getLineHeight() / doc.internal.scaleFactor
		doc.text(entry.description, 20, pos.y, { align: 'justify', maxWidth: docWidth - 40 })
		pos.y += descriptionHeight + 10
	}
	pos.y += 5

	doc.rect(10, pos.y - 7, docWidth - 20, 10)
	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text('Lfd.', 20, pos.y)
	doc.text('Titel', 50, pos.y)
	doc.text('Betrag', docWidth - 15, pos.y, { align: 'right' })
	pos.y += 11

	let category: string | null = null
	for (const item of entry.items) {
		if (item.title.includes(' - ')) {
			const [itemCategory, itemTitle] = item.title.split(' - ')
			if (category !== itemCategory) {
				doc.setFont('OpenSans', 'bold')
				doc.setFontSize(12)
				doc.text(itemCategory, docWidth / 2, pos.y, { align: 'center' })
				pos.y += 10
				category = itemCategory
			}
			item.title = itemTitle
		} else if (category !== null) {
			pos.y += 2
			category = null
		}

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		const titleHeight =
			(doc.splitTextToSize(item.title, docWidth - 115) as unknown[]).length *
			doc.getLineHeight() / doc.internal.scaleFactor

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(10)
		const descriptionHeight = (item.description
			? (doc.splitTextToSize(item.description, docWidth - 115) as unknown[]).length
			: 0) *
			doc.getLineHeight() / doc.internal.scaleFactor

		doc.rect(10, pos.y - 7, docWidth - 20, titleHeight + descriptionHeight + 5)

		if (item.ord) {
			doc.setFont('OpenSans', 'normal')
			doc.setFontSize(12)
			doc.text(item.ord.toString(), 20, pos.y)
		}

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		doc.text(
			item.title,
			50, pos.y,
			{ align: 'justify', maxWidth: docWidth - 115 },
		)

		if (item.description) {
			doc.setFont('OpenSans', 'italic')
			doc.setFontSize(10)
			doc.text(
				item.description, 50, pos.y + titleHeight,
				{ align: 'justify', maxWidth: docWidth - 115 },
			)
		}

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		doc.text(formatCurrency(item.amount), docWidth - 15, pos.y, { align: 'right' })

		pos.y += titleHeight + descriptionHeight + 5
	}

	pos.y += 1
	doc.rect(10, pos.y - 7, docWidth - 20, 10)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(12)
	doc.text('Summe der Ausgaben / Geplanter Verlust', 20, pos.y)

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(12)
	doc.text(
		formatCurrency(entry.items.map((item) => item.amount).reduce((a, b) => a + b, 0)),
		docWidth - 15, pos.y, { align: 'right' },
	)

	pos.y += 10

	pos.finalize()
	return doc
}