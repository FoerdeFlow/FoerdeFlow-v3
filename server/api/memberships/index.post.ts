import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const membershipSchema = createInsertSchema(memberships).omit({ id: true })
	const body = await readValidatedBody(event, async (body: unknown) => z.object({
		...membershipSchema.shape,
		startDate: z.coerce.date().nullish().optional(),
		endDate: z.coerce.date().nullish().optional(),
	}).parseAsync(body))

	return await database
		.insert(memberships)
		.values(body)
		.returning({ id: memberships.id })
})
