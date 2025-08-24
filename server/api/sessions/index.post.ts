import { eq } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()
	const client = useOpenslides()

	const sessionSchema = createInsertSchema(sessions).omit({ id: true })
	const body = await readValidatedBody(event, async (body) =>
		await sessionSchema.parseAsync(
			await z.object({
				plannedDate: z.coerce.date(),
				startDate: z.coerce.date().optional(),
				endDate: z.coerce.date().optional(),
			}).passthrough().parseAsync(body),
		),
	)

	return await database.transaction(async (tx) => {
		const [ result ] = await tx.insert(sessions).values(body).returning({ id: sessions.id })
		const committee = await tx.query.organizationItems.findFirst({
			where: eq(organizationItems.id, body.organizationItem),
		})
		if(!committee) throw new Error('Committee not found')
		const room = await tx.query.rooms.findFirst({
			where: eq(rooms.id, body.room),
			with: {
				building: true,
			},
		})
		if(!room) throw new Error('Room not found')

		await client.connect()
		const { id: committeeId } = await client.presenters.search_for_id_by_external_id({
			collection: 'committee',
			external_id: body.organizationItem,
			context_id: 1,
		})
		const { id: templateId } = await client.presenters.search_for_id_by_external_id({
			collection: 'meeting',
			external_id: `${body.organizationItem}-Template`,
			context_id: committeeId,
		})
		await client.meeting.clone({
			meeting_id: templateId,
			external_id: result.id,
			committee_id: committeeId,
			name: `${committee.code}-Sitzung ${formatSessionNumber(body.period, body.number)}`,
			welcome_title: `${committee.code}-Sitzung ${formatSessionNumber(body.period, body.number)}`,
			description: `${body.number.toString()}. Sitzung | ${formatTime(body.plannedDate)} Uhr`,
			start_time: body.plannedDate,
			end_time: body.plannedDate,
			location: formatRoom(room),
		})

		return result
	})
})
