import type { ExpandedProcessMutations } from '~~/server/types/expandedProcessMutations'

import { jsPDF } from 'jspdf'

import type { TravelRow } from '../travelRows'
import type { PdfEncoderOptions } from './types'

interface TravelSection {
	heading: string
	rows: TravelRow[]
	/** Shows the values right-aligned, as amounts of money. */
	amounts?: boolean
}

/**
 * Draws a document of the travel regulation: a heading, the title and a list
 * of sections made of labelled rows.
 *
 * @param heading - The kind of document
 * @param title - The title of the journey
 * @param sections - The sections to draw
 * @param options - Layout options passed through by the caller
 * @returns The rendered document
 */
async function pdfDrawTravelDocument(
	heading: string,
	title: string,
	sections: TravelSection[],
	options: PdfEncoderOptions,
) {
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
					doc.setFontSize(12)
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

				pdfDrawRunningHeader(doc, heading, [ title ], options.document ? 25 : 15)
				return
			}
			this._y = value
		},
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

	const lineHeight = () => doc.getLineHeight() / doc.internal.scaleFactor

	const logoWidth = await pdfDrawLogo(doc, options.organizationItem, pos.y)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(24)
	doc.text(heading, 20, pos.y)
	pos.y += 10

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(18)
	const titleLines = doc.splitTextToSize(title, docWidth - logoWidth - 45) as string[]
	doc.text(titleLines, 20, pos.y)
	pos.y += (titleLines.length - 1) * lineHeight() + 16

	for(const section of sections) {
		pos.reserve(20)
		doc.setFont('OpenSans', 'bold')
		doc.setFontSize(14)
		doc.text(section.heading, 20, pos.y)
		pos.y += 8

		doc.setFontSize(11)
		for(const row of section.rows) {
			if(section.amounts) {
				doc.setFont('OpenSans', 'normal')
				const keyLines = doc.splitTextToSize(row.key, docWidth - 80) as string[]
				const height = keyLines.length * lineHeight()
				pos.reserve(height)
				doc.text(keyLines, 20, pos.y)
				doc.text(row.value, docWidth - 20, pos.y, { align: 'right' })
				pos.y += height + 2
				continue
			}

			doc.setFont('OpenSans', 'normal')
			const valueLines = doc.splitTextToSize(row.value, docWidth - 95) as string[]
			doc.setFont('OpenSans', 'bold')
			const keyLines = doc.splitTextToSize(row.key, 65) as string[]
			const height = Math.max(valueLines.length, keyLines.length) * lineHeight()
			pos.reserve(height)
			doc.text(keyLines, 20, pos.y)
			doc.setFont('OpenSans', 'normal')
			doc.text(valueLines, 90, pos.y)
			pos.y += height + 2
		}
		pos.y += 8
	}

	if(options.signature) {
		pdfDrawSignatureBlock(doc, pos, options.signature)
	}

	pos.finalize()
	return doc
}

export async function pdfEncodeTravelPermit(
	entry: ExpandedProcessMutations['travelPermit'],
	options: PdfEncoderOptions = {},
) {
	return await pdfDrawTravelDocument(
		'Dienstreisegenehmigung',
		entry.title,
		[
			{ heading: 'Angaben zur Dienstreise', rows: travelPermitRows(entry) },
			{ heading: 'Voraussichtliche Kosten', rows: travelPermitCostRows(entry), amounts: true },
		],
		options,
	)
}

/**
 * Throws when an advance or a claim lost the permit it refers to, which only
 * happens if the data of the process is broken.
 *
 * @param entry - The advance or the claim
 * @param kind - How the entry is named in the message
 * @returns The permit of the entry
 */
function requirePermit(entry: { permit: ExpandedProcessMutations['travelPermit'] | null }, kind: string) {
	if(!entry.permit) {
		throw createError({
			status: 500,
			message: `Invalid ${kind} object (no permit)`,
		})
	}
	return entry.permit
}

export async function pdfEncodeTravelAdvance(
	entry: ExpandedProcessMutations['travelAdvance'],
	options: PdfEncoderOptions = {},
) {
	const permit = requirePermit(entry, 'travelAdvance')

	return await pdfDrawTravelDocument(
		'Vorschuss auf Reisekosten',
		permit.title,
		[
			{
				heading: 'Vorschuss',
				rows: [
					{
						key: 'Voraussichtliche Kosten',
						value: formatCurrency(permit.amount, 'amount'),
					},
					{ key: 'Höhe des Vorschusses', value: formatCurrency(entry.amount, 'amount') },
				],
				amounts: true,
			},
			{ heading: 'Angaben zur Dienstreise', rows: travelPermitRows(permit) },
		],
		options,
	)
}

export async function pdfEncodeTravelClaim(
	entry: ExpandedProcessMutations['travelClaim'],
	options: PdfEncoderOptions = {},
) {
	const permit = requirePermit(entry, 'travelClaim')

	return await pdfDrawTravelDocument(
		'Antrag auf Reisekostenerstattung',
		permit.title,
		[
			{ heading: 'Kosten', rows: travelClaimCostRows(entry), amounts: true },
			{ heading: 'Angaben zur Dienstreise', rows: travelPermitRows(permit) },
		],
		options,
	)
}
