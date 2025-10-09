import { z } from 'zod'
import { jsPDF } from 'jspdf'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		budgetPlan: idSchema,
	}).parseAsync(data))

	const result = await $fetch(`/api/budgetPlans/${params.budgetPlan}`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
		},
	})

	const budget = `${result.budget.name} (${result.budget.code})`
	const period = `${formatDate(result.startDate, 'compact')} - ${formatDate(result.endDate, 'compact')}`

	// eslint-disable-next-line new-cap
	const doc = new jsPDF()
	const docWidth = doc.internal.pageSize.getWidth()
	const docHeight = doc.internal.pageSize.getHeight()
	const pos = {
		_y: 20,
		_number: 1,
		get y() {
			return this._y
		},
		set y(value) {
			if(value > docHeight - 30) {
				doc.setFont('OpenSans', 'normal')
				doc.setFontSize(14)
				doc.text(this._number.toString(), docWidth / 2, docHeight - 10, { align: 'center' })
				doc.addPage()
				this._number++
				this._y = 30

				doc.setFont('OpenSans', 'italic')
				doc.setFontSize(14)
				doc.text('Haushaltsplan', 20, 15, { align: 'left' })
				doc.text(`${budget} | ${period}`, docWidth - 20, 15, { align: 'right' })
				return
			}
			this._y = value
		},
		finalize() {
			doc.setFont('OpenSans', 'normal')
			doc.setFontSize(12)
			doc.text(this._number.toString(), docWidth / 2, docHeight - 10, { align: 'center' })
		},
	}

	const logo = await useStorage('assets:server').getItemRaw('img/logo.png')
	const logoProps = doc.getImageProperties(logo)
	const logoHeight = 30
	const logoWidth = logoProps.width / logoProps.height * logoHeight
	doc.addImage(logo, 'PNG', docWidth - logoWidth - 20, pos.y - logoHeight / 2, logoWidth, logoHeight)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(32)
	doc.text('Haushaltsplan', 20, pos.y)
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
	pos.y += 20

	doc.rect(10, pos.y - 7, docWidth - 20, 10)
	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text('Einnahmen', 15, pos.y)
	doc.text('Titel', 50, pos.y)
	doc.text('Lfd.', docWidth - 50, pos.y, { align: 'right' })
	doc.text('Ausgaben', docWidth - 15, pos.y, { align: 'right' })
	pos.y += 11

	let category: string | null = null
	for(const item of result.items) {
		if(item.title.includes(' - ')) {
			const [ itemCategory, itemTitle ] = item.title.split(' - ')
			if(category !== itemCategory) {
				doc.setFont('OpenSans', 'bold')
				doc.setFontSize(12)
				doc.text(itemCategory, docWidth / 2, pos.y, { align: 'center' })
				pos.y += 10
				category = itemCategory
			}
			item.title = itemTitle
		} else if(category !== null) {
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

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		doc.text(formatCurrency(item.revenues), 42, pos.y, { align: 'right' })

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		doc.text(
			item.title,
			50, pos.y,
			{ align: 'justify', maxWidth: docWidth - 115 },
		)

		if(item.ord) {
			doc.setFont('OpenSans', 'normal')
			doc.setFontSize(12)
			doc.text(item.ord.toString(), docWidth - 50, pos.y, { align: 'right' })
		}

		if(item.description) {
			doc.setFont('OpenSans', 'italic')
			doc.setFontSize(10)
			doc.text(
				item.description, 50, pos.y + titleHeight,
				{ align: 'justify', maxWidth: docWidth - 115 },
			)
		}

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		doc.text(formatCurrency(item.expenses), docWidth - 15, pos.y, { align: 'right' })

		pos.y += titleHeight + descriptionHeight + 5
	}

	pos.y += 1
	doc.rect(10, pos.y - 7, docWidth - 20, 10)

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(12)
	doc.text(
		formatCurrency(result.items.map((item) => item.revenues).reduce((a, b) => a + b, 0)),
		42, pos.y, { align: 'right' },
	)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(12)
	doc.text('Summe Einnahmen/Ausgaben', docWidth / 2, pos.y, { align: 'center' })

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(12)
	doc.text(
		formatCurrency(result.items.map((item) => item.expenses).reduce((a, b) => a + b, 0)),
		docWidth - 15, pos.y, { align: 'right' },
	)

	pos.y += 10

	pos.finalize()
	const blob = doc.output('blob')
	setResponseHeader(
		event,
		'Content-Disposition',
		`inline; filename="Haushaltsplan_${result.budget.code}_${formatDate(result.startDate, 'iso')}.pdf"`,
	)
	return blob
})
