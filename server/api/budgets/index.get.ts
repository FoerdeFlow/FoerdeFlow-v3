export default defineEventHandler(async (_event) => {
	await checkPermission('budgets.read')

	const database = useDatabase()

	const budgets = await database.query.budgets.findMany({
		with: {
			organizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	return budgets
})
