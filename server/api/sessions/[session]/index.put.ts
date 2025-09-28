import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('sessions.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		session: idSchema,
	}).parseAsync(data))

	const sessionSchema = createUpdateSchema(sessions).omit({ id: true })
	const body = await readValidatedBody(event, async (body: unknown) =>
		await sessionSchema.parseAsync(
			await z.object({
				plannedDate: z.coerce.date(),
				startDate: z.coerce.date().optional(),
				endDate: z.coerce.date().optional(),
			}).passthrough().parseAsync(body),
		),
	)
	const updateBody = {
		startDate: null,
		endDate: null,
		...body,
	}

	const result = await database
		.update(sessions)
		.set(updateBody)
		.where(eq(sessions.id, params.session))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: params.session,
			},
		})
	}
})
