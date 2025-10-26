import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('announcements.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		announcement: idSchema,
	}).parseAsync(data))

	const announcement = await database.query.announcements.findFirst({
		where: eq(announcements.id, params.announcement),
	})

	if(!announcement) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Ankündigung nicht gefunden',
			data: {
				announcementId: params.announcement,
			},
		})
	}

	return announcement
})
