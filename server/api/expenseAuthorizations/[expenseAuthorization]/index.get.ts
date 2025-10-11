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
									code: true,
									name: true,
								},
							},
						},
						columns: {
							startDate: true,
							endDate: true,
						},
					},
				},
				columns: {
					plan: false,
				},
			},
			items: {
				columns: {
					expenseAuthorization: false,
				},
				orderBy: (items, { asc }) => [ asc(items.ord) ],
			},
		},
		columns: {
			id: false,
			budgetPlanItem: false,
		},
	})

	await checkPermission(
		'expenseAuthorizations.read',
		{ organizationItem: expenseAuthorization?.budgetPlanItem.plan.budget.organizationItem },
	)

	if(!expenseAuthorization) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Ausgabeermächtigung nicht gefunden',
			data: {
				expenseAuthorizationId: params.expenseAuthorization,
			},
		})
	}

	return expenseAuthorization
})
