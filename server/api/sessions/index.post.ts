import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'
import { useOpenslides } from '~/server/utils/openslides'

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
			}).passthrough().parseAsync(body)
		)
	)

	await client.connect()
	await client.meeting.clone({
		meeting_id: 1,
		name: body.period + "/" + body.number,
	})

	return await database
		.insert(sessions)
		.values(body)
		.returning({ id: sessions.id })
})