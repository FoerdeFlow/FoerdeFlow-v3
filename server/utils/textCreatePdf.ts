import { jsPDF } from 'jspdf'

export function textCreatePdf(title: string, text: string) {
	const doc = new jsPDF()
	const docWidth = doc.internal.pageSize.getWidth() - 40
	const docHeight = doc.internal.pageSize.getHeight() - 20

	let y = 35
	const printText = (message: string) => {
		const lines = doc.splitTextToSize(message, docWidth)
		const height = (1.4 * lines.length - 0.4 - 0.15/1.15) * doc.getLineHeight() / doc.internal.scaleFactor
		if(y + height > docHeight) {
			doc.addPage()
			y = 35
		}
		doc.text(message, 20, y, {
			maxWidth: docWidth,
			align: 'justify',
			lineHeightFactor: 1.4 * 1.15,
		})
		y += height + 8
	}

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(24)
	printText(title)

	text.split('\n').filter((line) => line.trim() !== '').forEach(line => {
		let fontSize = 12
		let fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'

		if(line.startsWith('# ')) {
			fontSize = 16
			fontStyle = 'bold'
			line = line.slice(2)
		}

		doc.setFont('OpenSans', fontStyle)
		doc.setFontSize(fontSize)
		printText(line)
	})

	return doc
}