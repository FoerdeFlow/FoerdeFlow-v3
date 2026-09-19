import type jsPDF from 'jspdf'

import type { PdfPosition, PdfSignatureOptions } from './types'

/**
 * Draws a block of handwritten signature lines below the content already written.
 *
 * The block is appended at the current writing position, so it stays on the page of
 * the specialist data whenever there is room left. Every write goes through the
 * caller's `pos` object, which is what moves the block to the next page — including
 * the running header — once the page is full.
 *
 * @param doc - The document to draw into
 * @param pos - The writing position of the calling encoder
 * @param entry - The signature configuration to render
 */
export function pdfDrawSignatureBlock(
	doc: jsPDF,
	pos: PdfPosition,
	entry: PdfSignatureOptions,
) {
	const docWidth = doc.internal.pageSize.getWidth()

	pos.y += 15

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(10)
	const hintHeight = entry.hint
		? (doc.splitTextToSize(entry.hint, docWidth - 40) as unknown[]).length *
			doc.getLineHeight() / doc.internal.scaleFactor + 5
		: 0
	// The name introduces the lines below it and must not be left behind alone.
	pos.reserve(hintHeight + 8 + 30)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	doc.text(entry.name, 20, pos.y, { maxWidth: docWidth - 40 })
	pos.y += 8

	if(entry.hint) {
		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(10)
		doc.text(entry.hint, 20, pos.y, { align: 'justify', maxWidth: docWidth - 40 })
		pos.y += hintHeight
	}

	for(const line of entry.lines) {
		pos.reserve(line.hint ? 35 : 30)

		pos.y += 20
		doc.setLineWidth(0.3)
		doc.line(20, pos.y, docWidth / 2 - 5, pos.y)
		doc.line(docWidth / 2 + 5, pos.y, docWidth - 20, pos.y)
		pos.y += 5

		doc.setFont('OpenSans', 'normal')
		doc.setFontSize(10)
		doc.text(line.label, 20, pos.y, { maxWidth: docWidth / 2 - 25 })
		doc.text('Ort, Datum', docWidth / 2 + 5, pos.y)

		if(line.hint) {
			pos.y += 5
			doc.setFont('OpenSans', 'italic')
			doc.setFontSize(9)
			doc.text(line.hint, 20, pos.y, { maxWidth: docWidth / 2 - 25 })
		}

		pos.y += 5
	}
}
