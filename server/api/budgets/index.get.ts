import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('budgets.read')

	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: idSchema.optional(),
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database.query.budgets.findMany({
		// Narrowed down where a workflow only offers the budgets of one
		// organization item, unfiltered everywhere else.
		where: query.organizationItem
			? eq(budgets.organizationItem, query.organizationItem)
			: undefined,
		with: {
			organizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	return result
})
