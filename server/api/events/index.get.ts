import z from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.uuid(),
	}).parseAsync(data))

	await checkPermission('events.read', { organizationItem: query.organizationItem })

	const database = useDatabase()

	const result = await database.query.events.findMany({
		where: (events, { eq }) => eq(events.organizationItem, query.organizationItem),
		with: {
			organizationItem: true,
			type: true,
			location: {
				with: {
					parent: true,
				},
				columns: {
					parent: false,
				},
			},
			onlineLocation: {
				with: {
					parent: true,
				},
				columns: {
					parent: false,
				},
			},
		},
		columns: {
			organizationItem: false,
			type: false,
			location: false,
			onlineLocation: false,
		},
		orderBy: (events, { asc }) => [
			asc(events.startDate),
		],
	})

	return result
})
