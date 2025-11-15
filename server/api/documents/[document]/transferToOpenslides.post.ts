import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		document: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const document = await database.query.documents.findFirst({
		where: eq(documents.id, params.document),
		with: {
			organizationItem: true,
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

	await checkPermission('documents.update', { organizationItem: document.organizationItem.id })

	const body = await readValidatedBody(event, async (data) => await z.object({
		session: z.uuid(),
	}).parseAsync(data))

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, body.session),
		columns: {
			id: true,
			organizationItem: true,
		},
	})

	if(!session) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: body.session,
			},
		})
	}

	const client = useOpenslides()
	await client.connect()

	const openslidesMeetingId = await getOpenslidesMeetingId(client, session.organizationItem, session.id)
	const qualifiedMeetingId = `meeting/${openslidesMeetingId}`
	const filename = `Vorlage_${document.organizationItem.code}_` +
		`${formatDocumentNumber(document.period, document.number)}.pdf`
	const content = await readFile(`./data/${document.id}.pdf`)
	await client.mediafile.upload({
		owner_id: qualifiedMeetingId,
		file: content.toString('base64'),
		filename,
		title: `Vorlage ${formatDocumentNumber(document.period, document.number)}: ${document.title}`,
	})
})
