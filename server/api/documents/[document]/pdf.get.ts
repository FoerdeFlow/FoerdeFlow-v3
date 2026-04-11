import { readFile } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { jsPDF } from 'jspdf'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		document: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const document = await database.query.documents.findFirst({
		where: eq(documents.id, params.document),
		with: {
			organizationItem: true,
			type: true,
			authorPerson: true,
			authorOrganizationItem: true,
		},
		columns: {
			period: true,
			number: true,
			title: true,
		},
	})

	if(!document) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Dokument nicht gefunden',
			data: {
				documentId: params.document,
			},
		})
	}

	await checkPermission('documents.read', { organizationItem: document.organizationItem.id })

	const filename = `Vorlage_${document.organizationItem.code}_` +
		`${formatDocumentNumber(document.period, document.number)}.pdf`
	setResponseHeader(event, 'Content-Disposition', `inline; filename="${filename}"`)

	const file = await readFile(`./data/${params.document}.pdf`)

	// eslint-disable-next-line new-cap
	const doc = new jsPDF()
	const docWidth = doc.internal.pageSize.getWidth()
	const docHeight = doc.internal.pageSize.getHeight()
	const logo = await useStorage('assets:server').getItemRaw('img/logo.png')
	const logoProps = doc.getImageProperties(logo)
	const logoHeight = 30
	const logoWidth = logoProps.width / logoProps.height * logoHeight
	doc.addImage(logo, 'PNG', docWidth - logoWidth - 20, 20 - logoHeight / 2, logoWidth, logoHeight)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(14)
	const prefix = `${document.organizationItem.code}-Drs.`
	const prefixWidth = doc.getTextWidth(prefix)
	doc.text(prefix, 20, 30)
	doc.setFontSize(24)
	doc.text(formatDocumentNumber(document.period, document.number), 25 + prefixWidth, 30)

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(16)
	doc.text(document.type.name, 20, 60)

	doc.setFont('OpenSans', 'bold')
	doc.setFontSize(20)
	doc.text(document.title, 20, 70, { maxWidth: docWidth - 40, align: 'justify' })

	doc.setFont('OpenSans', 'normal')
	doc.setFontSize(12)
	doc.text('eingereicht von', 20, 120)
	if(document.authorPerson) {
		doc.setFontSize(16)
		doc.text(formatPerson(document.authorPerson), 20, 130)
	} else if(document.authorOrganizationItem) {
		doc.setFontSize(16)
		doc.text(formatOrganizationItem(document.authorOrganizationItem), 20, 130)
	}

	const prefixFile = doc.output('arraybuffer')

	const rawPdfDoc = await PDFDocument.load(file)
	const pdfDoc = await PDFDocument.load(prefixFile)
	const pdfFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
	const pdfFontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)

	const rawPages = await pdfDoc.copyPages(rawPdfDoc, rawPdfDoc.getPageIndices())
	rawPages.forEach((page) => pdfDoc.addPage(page))

	const [ _prefixPage, ...pages ] = pdfDoc.getPages()
	for(const page of pages) {
		const { width, height } = page.getSize()
		page.drawText(`${document.organizationItem.code}-Drs.`, {
			x: 20,
			y: height - 30,
			size: 12,
			font: pdfFont,
			color: rgb(0, 0, 0),
		})
		page.drawText(formatDocumentNumber(document.period, document.number), {
			x: 100,
			y: height - 30,
			size: 20,
			font: pdfFontBold,
			color: rgb(0, 0, 0),
		})
		page.drawText(`—   ${pages.indexOf(page) + 2}   —`, {
			x: width / 2 - 30,
			y: height - 30,
			size: 12,
			font: pdfFont,
			color: rgb(0, 0, 0),
		})
	}

	const blob = await pdfDoc.save()
	return blob
})
