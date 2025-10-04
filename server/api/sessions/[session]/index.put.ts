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
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('sessions.update', { organizationItem: session?.organizationItem })

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
