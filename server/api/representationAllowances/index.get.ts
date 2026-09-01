import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: idSchema,
	}).parseAsync(data))

	await checkPermission('representationAllowances.read', { organizationItem: query.organizationItem })

	const database = useDatabase()

	const result = await database.query.representationAllowances.findMany({
		where: eq(representationAllowances.organizationItem, query.organizationItem),
		with: {
			recipients: {
				with: {
					person: {
						columns: {
							id: true,
							firstName: true,
							lastName: true,
							callName: true,
						},
					},
				},
				columns: {
					id: true,
					ord: true,
					amount: true,
				},
				orderBy: (recipients, { asc }) => [ asc(recipients.ord) ],
			},
		},
		columns: {
			id: true,
			title: true,
			periodUnit: true,
			startDate: true,
			endDate: true,
		},
	})

	return result
})
