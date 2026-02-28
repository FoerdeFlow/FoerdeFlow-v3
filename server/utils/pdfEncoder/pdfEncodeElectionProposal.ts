import { jsPDF } from 'jspdf'

export async function pdfEncodeElectionProposal(entry: {
	id?: string
	election: string
	submitter: string
	committee: string
	photo: Buffer | null
	candidate: string
	postalAddress: string
	email: string
	matriculationNumber: string
	council: string
	course: string
	applicationLetter: string
}) {
	// eslint-disable-next-line new-cap
	const doc = new jsPDF()
	const docWidth = doc.internal.pageSize.getWidth()
	const docHeight = doc.internal.pageSize.getHeight()

	let y = 20

	const logo = await useStorage('assets:server').getItemRaw('img/logo.png')
	const logoProps = doc.getImageProperties(logo)
	const logoHeight = 30
	const logoWidth = logoProps.width / logoProps.height * logoHeight
	doc.addImage(logo, 'PNG', docWidth - logoWidth - 20, y - logoHeight / 2, logoWidth, logoHeight)

	doc.setFontSize(32)
	doc.setFont('OpenSans', 'bold')
	doc.text('Wahlvorschlag', 20, y)
	y += 8

	doc.setFontSize(12)
	doc.text(entry.election, 20, y)
	y += 12

	doc.setFont('OpenSans', 'bold')
	doc.text('Einreicher*in:', 20, y)
	doc.setFont('OpenSans', 'normal')
	doc.text(entry.submitter, 60, y)
	y += 7

	doc.setFont('OpenSans', 'bold')
	doc.text('Gremium:', 20, y)
	doc.setFont('OpenSans', 'normal')
	doc.text(entry.committee, 60, y)
	y += 12

	const photoHeight = 70
	if (entry.photo) {
		const photoProps = doc.getImageProperties(entry.photo)
		const photoWidth = photoProps.width / photoProps.height * photoHeight
		doc.addImage(entry.photo, 'PNG', docWidth / 2 - photoWidth / 2, y, photoWidth, photoHeight)
		doc.rect(docWidth / 2 - photoWidth / 2, y, photoWidth, photoHeight, 'S')
	}
	y += photoHeight + 12

	doc.setFontSize(24)
	doc.setFont('OpenSans', 'bold')
	doc.text(entry.candidate, docWidth / 2, y, { align: 'center' })
	y += 12

	doc.setFontSize(12)

	doc.setFont('OpenSans', 'bold')
	doc.text('Anschrift:', 20, y)
	doc.setFont('OpenSans', 'normal')
	doc.text(entry.postalAddress, 60, y)
	y += 7

	doc.setFont('OpenSans', 'bold')
	doc.text('E-Mail-Adresse:', 20, y)
	doc.setFont('OpenSans', 'normal')
	doc.text(entry.email, 60, y)
	y += 7

	doc.setFont('OpenSans', 'bold')
	doc.text('Matrikelnummer:', 20, y)
	doc.setFont('OpenSans', 'normal')
	doc.text(entry.matriculationNumber, 60, y)
	y += 7

	doc.setFont('OpenSans', 'bold')
	doc.text('Fachschaft:', 20, y)
	doc.setFont('OpenSans', 'normal')
	doc.text(entry.council, 60, y)
	y += 7

	doc.setFont('OpenSans', 'bold')
	doc.text('Studiengang:', 20, y)
	doc.setFont('OpenSans', 'normal')
	doc.text(entry.course, 60, y)
	y += 16

	doc.text(entry.applicationLetter, 20, y, { maxWidth: docWidth - 40, align: 'justify' })

	doc.line(docWidth - 80, docHeight - 20, docWidth - 20, docHeight - 20)
	doc.setFontSize(9)
	doc.setFont('OpenSans', 'italic')
	doc.text('Unterschrift der*des Kandidat*in', docWidth - 50, docHeight - 17, { align: 'center' })

	return doc
}
