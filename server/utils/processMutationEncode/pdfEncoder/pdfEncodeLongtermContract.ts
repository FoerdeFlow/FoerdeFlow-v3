import { jsPDF } from 'jspdf'

const timeUnitLabels = {
	month: 'Monat',
	quarter: 'Quartal',
	semester: 'Semester',
	year: 'Jahr',
} as const

function formatItemCondition(item: {
	type: 'time' | 'usage' | 'fixed'
	timeUnit: 'month' | 'quarter' | 'semester' | 'year' | null
	usageUnit: string | null
	expectedUsage: number | null
}): string {
	switch(item.type) {
		case 'time':
			return item.timeUnit
				? `je ${timeUnitLabels[item.timeUnit]}`
				: ''
		case 'usage':
			return [
				item.usageUnit ? `je ${item.usageUnit}` : '',
				item.expectedUsage !== null && item.timeUnit
					? `erwartet ${item.expectedUsage} je ${timeUnitLabels[item.timeUnit]}`
					: '',
			].filter(Boolean).join(' · ')
		case 'fixed':
			return 'einmalig'
	}
}

export async function pdfEncodeLongtermContract(entry: {
	id?: string
	budget: {
		name: string
		code: string
	} | null
	title: string
	description: string | null
	startDate: string
	endDate: string | null
	items: {
		ord: number | null
		type: 'time' | 'usage' | 'fixed'
		title: string
		description: string | null
		amount: number
		timeUnit: 'month' | 'quarter' | 'semester' | 'year' | null
		usageUnit: string | null
		expectedUsage: number | null
	}[]
}, options: {
	document?: boolean
} = {}) {
	if(!entry.budget) {
		throw createError({
			status: 500,
			message: 'Invalid longtermContract object (no budget)',
		})
	}

	const budget = [
		entry.budget.name,
		`(${entry.budget.code})`,
	].join(' ')
	const title = entry.title
	const period = entry.endDate
		? [
			formatDate(entry.startDate, 'compact'),
			formatDate(entry.endDate, 'compact'),
		].join(' - ')
		: `ab ${formatDate(entry.startDate, 'compact')} (unbefristet)`

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
			if(value > docHeight - 30) {
				if(!options.document) {
					doc.setFont('OpenSans', 'normal')
					doc.setFontSize(14)
					doc.text(
						this._number.toString(),
						docWidth / 2, docHeight - 10,
						{ align: 'center' },
					)
				}
				doc.addPage()
				this._number++
				this._y = options.document ? 40 : 30

				doc.setFont('OpenSans', 'italic')
				doc.setFontSize(14)
				doc.text('Langzeitvertrag', 20, options.document ? 25 : 15, { align: 'left' })
				doc.text(
					`${title} | ${period}`,
					docWidth - 20, options.document ? 25 : 15,
					{ align: 'right' },
				)
				return
			}
			this._y = value
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
	doc.setFontSize(24)
	doc.text('Langzeitvertrag', 20, pos.y)
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
	doc.text('Vertragslaufzeit: ', 20, pos.y)
	pos.y += 8

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(14)
	doc.text(period, 20, pos.y)
	pos.y += 15

	if(entry.description) {
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

	for(const item of entry.items) {
		const condition = formatItemCondition(item)
		const subLine = [ condition, item.description ].filter(Boolean).join(' — ')

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		const titleHeight =
			(doc.splitTextToSize(item.title, docWidth - 115) as unknown[]).length *
			doc.getLineHeight() / doc.internal.scaleFactor

		doc.setFontSize(10)
		const subLineHeight = (subLine
			? (doc.splitTextToSize(subLine, docWidth - 115) as unknown[]).length
			: 0) *
			doc.getLineHeight() / doc.internal.scaleFactor

		doc.rect(10, pos.y - 7, docWidth - 20, titleHeight + subLineHeight + 5)

		if(item.ord) {
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

		if(subLine) {
			doc.setFont('OpenSans', 'italic')
			doc.setFontSize(10)
			doc.text(
				subLine, 50, pos.y + titleHeight,
				{ align: 'justify', maxWidth: docWidth - 115 },
			)
		}

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		doc.text(formatCurrency(item.amount), docWidth - 15, pos.y, { align: 'right' })

		pos.y += titleHeight + subLineHeight + 5
	}

	pos.y += 10

	pos.finalize()
	return doc
}
