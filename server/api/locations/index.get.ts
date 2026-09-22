import { eq, ne, or } from 'drizzle-orm'
import z from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('locations.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: idSchema.optional(),
	}).parseAsync(data))

	const database = useDatabase()

	// Ein Ad-hoc-Ort taucht nur bei dem Gremium auf, das ihn angelegt hat. Ohne
	// Gremium fragt die Verwaltung, die alle Orte zum Aufräumen braucht.
	const result = await database.query.locations.findMany({
		where: query.organizationItem
			? or(
				ne(locations.type, 'adHoc'),
				eq(locations.organizationItem, query.organizationItem),
			)
			: undefined,
		with: {
			parent: true,
		},
		columns: {
			parent: false,
		},
		orderBy: (locations, { asc }) => [
			asc(locations.code),
			asc(locations.name),
		],
	})

	return result
})
