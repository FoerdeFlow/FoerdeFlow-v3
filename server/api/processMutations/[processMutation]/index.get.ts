import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processMutation: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	return await database.transaction(async (tx) => {
		const processMutation = await tx.query.workflowProcessMutations.findFirst({
			where: eq(workflowProcessMutations.id, params.processMutation),
			with: {
				mutation: {
					columns: {
						table: true,
						action: true,
					},
				},
			},
			columns: {
				process: true,
				data: true,
			},
		})
		if(!processMutation) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Prozessinhalt nicht gefunden',
				data: {
					processMutationId: params.processMutation,
				},
			})
		}

		await checkProcessMutationPermission(tx, processMutation.process)

		return {
			mutation: processMutation.mutation,
			// Handed out as the input it was made from, so that what is edited
			// is exactly what is validated again when it is saved.
			data: processMutationInput(processMutation.mutation.table, processMutation.data),
		}
	})
})
