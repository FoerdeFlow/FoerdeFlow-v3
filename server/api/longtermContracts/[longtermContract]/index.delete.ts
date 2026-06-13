import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		longtermContract: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const longtermContract = await database.query.longtermContracts.findFirst({
		where: eq(longtermContracts.id, params.longtermContract),
		with: {
			budget: {
				columns: {
					organizationItem: true,
				},
			},
		},
		columns: {},
	})

	await checkPermission(
		'longtermContracts.delete',
		{ organizationItem: longtermContract?.budget.organizationItem },
	)

	const result = await database
		.delete(longtermContracts)
		.where(eq(longtermContracts.id, params.longtermContract))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Langzeitvertrag nicht gefunden',
			data: {
				longtermContractId: params.longtermContract,
			},
		})
	}
})
