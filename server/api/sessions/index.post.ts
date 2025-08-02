import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const sessionSchema = createInsertSchema(sessions).omit({ id: true })
	const body = await readValidatedBody(event, async (body: any) =>
		await sessionSchema.parseAsync(
			await z.object({
				plannedDate: z.coerce.date(),
				startDate: z.coerce.date().optional(),
				endDate: z.coerce.date().optional(),
			}).passthrough().parseAsync(body)
		)
	)

	return await database
		.insert(sessions)
		.values(body)
		.returning({ id: sessions.id })
})