import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelRoles.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelRole: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(travelRoles).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(travelRoles)
		.set(body)
		.where(eq(travelRoles.id, params.travelRole))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Dienstreiserolle nicht gefunden',
			data: {
				travelRoleId: params.travelRole,
			},
		})
	}
})
