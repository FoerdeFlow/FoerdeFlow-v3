import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.strictObject({
		filter: z.enum([ 'active' ]).optional(),
	}).parseAsync(data))

	if(query.filter !== 'active') {
		await checkPermission('announcements.read')
	}

	const database = useDatabase()

	const announcements = await database.query.announcements.findMany()

	return announcements
})
