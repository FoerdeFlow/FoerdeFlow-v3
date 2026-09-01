import { jsPDF } from 'jspdf'

export async function pdfEncodeRepresentationAllowance(entry: {
	id?: string
	organizationItem: {
		name: string
		code: string
	} | null
	title: string
	description: string | null
	periodUnit: 'month' | 'once'
	startDate: string
	endDate: string | null
	recipients: {
		ord: number | null
		amount: number
		person: {
			firstName: string
			lastName: string
			callName: string | null
			pronouns: string | null
		} | null
	}[]
}, options: {
	document?: boolean
} = {}) {
	if(!entry.organizationItem) {
		throw createError({
			status: 500,
			message: 'Invalid representationAllowance object (no organizationItem)',
		})
	}

	const title = entry.title
	const total = entry.recipients.reduce((sum, recipient) => sum + recipient.amount, 0)
	const period = entry.periodUnit === 'once'
		? formatDate(entry.startDate, 'compact')
		: entry.endDate
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
				doc.text('Aufwandsentschädigung', 20, options.document ? 25 : 15, { align: 'left' })
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
	doc.text('Aufwandsentschädigung', 20, pos.y)
	pos.y += 10

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(18)
	doc.text(entry.title, 20, pos.y)
	pos.y += 14

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text('Organisationseinheit: ', 20, pos.y)
	pos.y += 8

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(14)
	doc.text(formatOrganizationItem(entry.organizationItem), 20, pos.y)
	pos.y += 12

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text(entry.periodUnit === 'once' ? 'Datum der Zahlung: ' : 'Laufzeit: ', 20, pos.y)
	pos.y += 8

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(14)
	doc.text(period, 20, pos.y)
	pos.y += 12

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text(entry.periodUnit === 'once' ? 'Gesamtbetrag: ' : 'Gesamtbetrag je Monat: ', 20, pos.y)
	pos.y += 8

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(14)
	doc.text(formatCurrency(total), 20, pos.y)
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
	doc.text('Person', 50, pos.y)
	doc.text('Betrag', docWidth - 15, pos.y, { align: 'right' })
	pos.y += 11

	for(const recipient of entry.recipients) {
		const name = formatPerson(recipient.person, 'long')

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(12)
		const nameHeight =
			(doc.splitTextToSize(name, docWidth - 115) as unknown[]).length *
			doc.getLineHeight() / doc.internal.scaleFactor

		doc.rect(10, pos.y - 7, docWidth - 20, nameHeight + 5)

		if(recipient.ord !== null) {
			doc.text(recipient.ord.toString(), 20, pos.y)
		}

		doc.text(name, 50, pos.y, { align: 'justify', maxWidth: docWidth - 115 })
		doc.text(formatCurrency(recipient.amount), docWidth - 15, pos.y, { align: 'right' })

		pos.y += nameHeight + 5
	}

	doc.rect(10, pos.y - 7, docWidth - 20, 10)
	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(12)
	doc.text('Summe', 50, pos.y)
	doc.text(formatCurrency(total), docWidth - 15, pos.y, { align: 'right' })
	pos.y += 15

	pos.finalize()
	return doc
}
