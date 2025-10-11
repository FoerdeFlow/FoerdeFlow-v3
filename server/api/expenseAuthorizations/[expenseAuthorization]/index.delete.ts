import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		expenseAuthorization: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const expenseAuthorization = await database.query.expenseAuthorizations.findFirst({
		where: eq(expenseAuthorizations.id, params.expenseAuthorization),
		with: {
			budgetPlanItem: {
				with: {
					plan: {
						with: {
							budget: {
								columns: {
									organizationItem: true,
								},
							},
						},
						columns: {},
					},
				},
				columns: {},
			},
		},
		columns: {},
	})

	await checkPermission(
		'expenseAuthorizations.delete',
		{ organizationItem: expenseAuthorization?.budgetPlanItem.plan.budget.organizationItem },
	)

	const result = await database
		.delete(expenseAuthorizations)
		.where(eq(expenseAuthorizations.id, params.expenseAuthorization))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Ausgabeermächtigung nicht gefunden',
			data: {
				expenseAuthorizationId: params.expenseAuthorization,
			},
		})
	}
})
