import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const membershipSchema = createInsertSchema(memberships).omit({ id: true })
	const body = await readValidatedBody(event, async (body: unknown) =>
		await membershipSchema.parseAsync(
			await z.object({
				startDate: z.coerce.date().optional(),
				endDate: z.coerce.date().optional(),
			}).passthrough().parseAsync(body),
		),
	)

	return await database
		.insert(memberships)
		.values(body)
		.returning({ id: memberships.id })
})
