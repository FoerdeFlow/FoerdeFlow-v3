import type jsPDF from 'jspdf'

/**
 * Shortens a text with an ellipsis until it fits into the given width.
 *
 * @param doc - The document whose current font decides the width of the text
 * @param text - The text to shorten
 * @param maxWidth - The width the text has to fit into
 * @returns The text itself or a shortened version of it
 */
function pdfEllipsizeText(doc: jsPDF, text: string, maxWidth: number) {
	if(doc.getTextWidth(text) <= maxWidth) {
		return text
	}

	let shortened = text
	while(shortened.length > 0 && doc.getTextWidth(`${shortened.trimEnd()}…`) > maxWidth) {
		shortened = shortened.slice(0, -1)
	}
	return `${shortened.trimEnd()}…`
}

/**
 * Draws the running header repeated at the top of every continuation page.
 *
 * The heading is written to the left and the details are written to the right of the
 * page. Since the details are built from user input, their first part is shortened
 * with an ellipsis as far as needed to keep both texts from overlapping.
 *
 * @param doc - The document to draw into
 * @param heading - The kind of the document, e.g. `Ausgabeermächtigung`
 * @param details - The parts identifying the entry, the first one being shortenable
 * @param y - The baseline to write on
 */
export function pdfDrawRunningHeader(
	doc: jsPDF,
	heading: string,
	details: (string | null | undefined)[],
	y: number,
) {
	const docWidth = doc.internal.pageSize.getWidth()

	doc.setFont('OpenSans', 'italic')
	doc.setFontSize(14)
	doc.text(heading, 20, y, { align: 'left' })

	const [ subject = '', ...rest ] = details.filter((detail) => detail) as string[]
	const suffix = rest.map((detail) => ` | ${detail}`).join('')
	const maxWidth = docWidth - 50 - doc.getTextWidth(heading)
	const subjectWidth = maxWidth - doc.getTextWidth(suffix)

	doc.text(
		subjectWidth > 0
			? pdfEllipsizeText(doc, subject, subjectWidth) + suffix
			: pdfEllipsizeText(doc, subject + suffix, maxWidth),
		docWidth - 20,
		y,
		{ align: 'right' },
	)
}
