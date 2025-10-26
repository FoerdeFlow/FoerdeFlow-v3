import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('announcements.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		announcement: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(announcements).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(announcements)
		.set(body)
		.where(eq(announcements.id, params.announcement))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Ankündigung nicht gefunden',
			data: {
				announcementId: params.announcement,
			},
		})
	}
})
