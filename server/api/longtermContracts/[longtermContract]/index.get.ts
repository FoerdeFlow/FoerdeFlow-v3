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
					code: true,
					name: true,
				},
			},
			items: {
				columns: {
					longtermContract: false,
				},
				orderBy: (items, { asc }) => [ asc(items.ord) ],
			},
		},
		columns: {
			id: false,
			budget: false,
		},
	})

	await checkPermission(
		'longtermContracts.read',
		{ organizationItem: longtermContract?.budget.organizationItem },
	)

	if(!longtermContract) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Langzeitvertrag nicht gefunden',
			data: {
				longtermContractId: params.longtermContract,
			},
		})
	}

	return longtermContract
})
