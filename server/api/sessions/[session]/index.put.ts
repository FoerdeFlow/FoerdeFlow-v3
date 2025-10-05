import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		session: idSchema,
	}).parseAsync(data))

	const sessionSchema = createUpdateSchema(sessions).omit({ id: true, organizationItem: true })
	const body = await readValidatedBody(event, async (body: unknown) => z.strictObject({
		...sessionSchema.shape,
		plannedDate: z.coerce.date(),
		startDate: z.coerce.date().nullish().optional(),
		endDate: z.coerce.date().nullish().optional(),
	}).parseAsync(body))
	const updateBody = {
		startDate: null,
		endDate: null,
		...body,
	}

	const database = useDatabase()

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, params.session),
		with: {
			organizationItem: true,
		},
		columns: {},
	})

	await checkPermission('sessions.update', { organizationItem: session?.organizationItem.id })

	if(!session) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: params.session,
			},
		})
	}

	const client = useOpenslides()

	await database.transaction(async (tx) => {
		const [ result = null ] = await tx
			.update(sessions)
			.set(updateBody)
			.where(eq(sessions.id, params.session))
			.returning({
				period: sessions.period,
				number: sessions.number,
				plannedDate: sessions.plannedDate,
			})

		if(result === null) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Sitzung nicht gefunden',
				data: {
					sessionId: params.session,
				},
			})
		}

		await client.connect()
		const { id: committeeId } = await client.presenters.search_for_id_by_external_id({
			collection: 'committee',
			external_id: session.organizationItem.id,
			context_id: 1,
		})
		const { id: meetingId } = await client.presenters.search_for_id_by_external_id({
			collection: 'meeting',
			external_id: params.session,
			context_id: committeeId,
		})
		client.meeting.update({
			id: meetingId,
			name: `${session.organizationItem.code}-Sitzung ` +
				formatSessionNumber(result.period, result.number),
			welcome_title: `${session.organizationItem.code}-Sitzung ` +
				formatSessionNumber(result.period, result.number),
			description: [
				session.organizationItem.name,
				`${result.number.toString()}. Sitzung der Legislatur ${formatPeriod(result.period)}`,
				`${formatTime(result.plannedDate)} Uhr`,
			].join(' | '),
			start_time: result.plannedDate,
			end_time: result.plannedDate,
		})
	})

	try {
		await syncOpenslidesParticipants(client, params.session)
	} catch(e) {
		console.error('Error syncing participants:', e)
	}
})
