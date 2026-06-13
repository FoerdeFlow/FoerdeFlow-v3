import { eq } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createInsertSchema(longtermContracts).omit({ id: true }).shape,
		items: z.array(
			createInsertSchema(longtermContractItems)
				.omit({ id: true, longtermContract: true }),
		).min(1),
	}).parseAsync(data))

	const database = useDatabase()

	const budget = await database.query.budgets.findFirst({
		where: eq(budgets.id, body.budget),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('longtermContracts.create', { organizationItem: budget?.organizationItem })

	return await database.transaction(async (tx) => {
		const [ result ] = await tx
			.insert(longtermContracts)
			.values(body)
			.returning({ id: longtermContracts.id })

		if(!result) {
			throw createError({
				statusCode: 500,
				statusMessage: 'Langzeitvertrag konnte nicht erstellt werden',
			})
		}

		for(const item of body.items) {
			await tx
				.insert(longtermContractItems)
				.values({
					...item,
					longtermContract: result.id,
				})
		}

		return result
	})
})
