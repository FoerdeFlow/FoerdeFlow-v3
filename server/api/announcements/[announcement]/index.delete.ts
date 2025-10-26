import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('announcements.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		announcement: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(announcements)
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
