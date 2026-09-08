import { jsPDF } from 'jspdf'

import type { PdfEncoderOptions } from './types'

export async function pdfEncodePaymentOrder(entry: {
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
	} | null
	budget: {
		name: string
		code: string
	} | null
	expenseAuthorization: {
		title: string
		amount: number
	} | null
	recipientType: 'reimbursement' | 'invoice'
	recipientPerson: {
		firstName: string
		lastName: string
		callName: string | null
		pronouns: string | null
		iban: string | null
	} | null
	recipientName: string | null
	recipientIban: string | null
	purpose: string | null
	title: string
	description: string | null
	amount: number
}, options: PdfEncoderOptions = {}) {
	const budgetData = entry.budgetPlanItem?.plan.budget ?? entry.budget
	if(!budgetData) {
		throw createError({
			status: 500,
			message: 'Invalid paymentOrder object (neither budget nor budgetPlanItem)',
		})
	}

	const budget = [
		budgetData.name,
		`(${budgetData.code})`,
	].join(' ')
	const title = entry.title
	const period = entry.budgetPlanItem
		? [
			formatDate(entry.budgetPlanItem.plan.startDate, 'compact'),
			formatDate(entry.budgetPlanItem.plan.endDate, 'compact'),
		].join(' - ')
		: ''

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
						docWidth / 2,
						docHeight - 10,
						{ align: 'center' },
					)
				}
				doc.addPage()
				this._number++
				this._y = options.document ? 40 : 30

				doc.setFont('OpenSans', 'italic')
				doc.setFontSize(14)
				doc.text('Zahlungsanweisung', 20, options.document ? 25 : 15, { align: 'left' })
				doc.text(
					period ? `${title} | ${period}` : title,
					docWidth - 20,
					options.document ? 25 : 15,
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

	/**
	 * Writes a labelled value, which is what this document is made of.
	 *
	 * @param label - The label of the field
	 * @param value - The value of the field
	 */
	function field(label: string, value: string) {
		doc.setFont('OpenSans', 'bold')
		doc.setFontSize(14)
		doc.text(label, 20, pos.y)
		pos.y += 8

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(14)
		const lines = doc.splitTextToSize(value, docWidth - 40) as string[]
		doc.text(lines, 20, pos.y)
		pos.y += (lines.length - 1) * doc.getLineHeight() / doc.internal.scaleFactor + 12
	}

	const logo = await useStorage('assets:server').getItemRaw('img/logo.png')
	const logoProps = doc.getImageProperties(logo)
	const logoHeight = 30
	const logoWidth = logoProps.width / logoProps.height * logoHeight
	doc.addImage(logo, 'PNG', docWidth - logoWidth - 20, pos.y - logoHeight / 2, logoWidth, logoHeight)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(24)
	doc.text('Zahlungsanweisung', 20, pos.y)
	pos.y += 10

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(18)
	const titleLines = doc.splitTextToSize(entry.title, docWidth - logoWidth - 45) as string[]
	doc.text(titleLines, 20, pos.y)
	pos.y += (titleLines.length - 1) * doc.getLineHeight() / doc.internal.scaleFactor + 14

	field('Haushalt: ', budget)

	if(entry.budgetPlanItem) {
		field('Haushaltstitel: ', entry.budgetPlanItem.title)
		field('Haushaltsperiode: ', period)
	} else {
		doc.setFont('OpenSans', 'bold')
		doc.setFontSize(14)
		doc.text('Rücklagenausschüttung', 20, pos.y)
		pos.y += 20
	}

	if(entry.expenseAuthorization) {
		field(
			'Ausgabeermächtigung: ',
			`${entry.expenseAuthorization.title} ` +
				`(${formatCurrency(entry.expenseAuthorization.amount)})`,
		)
	}

	if(entry.recipientType === 'reimbursement') {
		field('Auslagenerstattung an: ', formatPerson(entry.recipientPerson, 'long'))
		// The bank details are only handed out to those who may see them, so the
		// document says so instead of leaving the reader guessing.
		field('IBAN: ', entry.recipientPerson?.iban
			? formatIban(entry.recipientPerson.iban)
			: 'Keine Bankverbindung hinterlegt')
	} else {
		field('Rechnung von: ', entry.recipientName ?? '')
		field('IBAN: ', formatIban(entry.recipientIban))
		field('Verwendungszweck: ', entry.purpose ?? '')
	}

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
	doc.setFontSize(12)
	doc.text('Anzuweisender Betrag', 20, pos.y)

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(12)
	doc.text(formatCurrency(entry.amount), docWidth - 15, pos.y, { align: 'right' })

	pos.y += 10

	if(options.signature) {
		pdfDrawSignatureBlock(doc, pos, options.signature)
	}

	pos.finalize()
	return doc
}
