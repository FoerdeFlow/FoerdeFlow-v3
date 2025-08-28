import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		membership: idSchema,
	}).parseAsync(data))

	const membershipSchema = createUpdateSchema(memberships).omit({ id: true })
	const body = await readValidatedBody(event, async (body: unknown) => z.object({
		...membershipSchema.shape,
		startDate: z.coerce.date().nullish().optional(),
		endDate: z.coerce.date().nullish().optional(),
	}).parseAsync(body))

	const result = await database
		.update(memberships)
		.set(body)
		.where(eq(memberships.id, params.membership))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Mitgliedschaft nicht gefunden',
			data: {
				membershipId: params.membership,
			},
		})
	}
})
