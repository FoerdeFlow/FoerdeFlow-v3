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

	const logo = await useStorage('assets:server').getItemRaw('img/logo.png')
	const logoProps = doc.getImageProperties(logo)
	const logoHeight = 30
	const logoWidth = logoProps.width / logoProps.height * logoHeight
	doc.addImage(logo, 'PNG', docWidth - logoWidth - 20, pos.y - logoHeight / 2, logoWidth, logoHeight)

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
			{
				heading: 'Reisende und genehmigte Kosten',
				rows: travelPermitTravelerRows(entry),
				amounts: true,
			},
		],
		options,
	)
}

export async function pdfEncodeTravelClaim(
	entry: ExpandedProcessMutations['travelClaim'],
	options: PdfEncoderOptions = {},
) {
	if(!entry.permit) {
		throw createError({
			status: 500,
			message: 'Invalid travelClaim object (no permit)',
		})
	}

	return await pdfDrawTravelDocument(
		'Reisekostenabrechnung',
		entry.title ?? entry.permit.title,
		[
			{ heading: 'Angaben zur Reise', rows: travelClaimRows(entry) },
			{
				heading: 'Kosten',
				rows: [ ...travelClaimItemRows(entry), ...travelClaimTotalRows(entry) ],
				amounts: true,
			},
			{ heading: 'Genehmigung', rows: travelPermitRows(entry.permit) },
		],
		options,
	)
}
