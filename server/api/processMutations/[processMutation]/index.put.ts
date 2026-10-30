import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processMutation: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		data: z.looseObject({}),
	}).parseAsync(data))

	const database = useDatabase()

	await database.transaction(async (tx) => {
		const processMutation = await tx.query.workflowProcessMutations.findFirst({
			where: eq(workflowProcessMutations.id, params.processMutation),
			with: {
				mutation: true,
				process: {
					columns: {
						id: true,
						initiatorType: true,
						initiatorPerson: true,
						initiatorOrganizationItem: true,
						createdAt: true,
					},
				},
			},
			columns: {
				id: true,
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

		await checkProcessMutationPermission(tx, processMutation.process.id)

		// Validated the same way the application itself was, with the initiator
		// of the process standing in for the one who submitted it. The presets
		// are resolved as of the day the process was created, so that a date
		// the workflow fixes does not travel to the day of the correction.
		const data = await validateProcessMutationData(
			tx,
			processMutation.mutation,
			body.data,
			{
				initiatorType: processMutation.process.initiatorType,
				initiatorPerson: processMutation.process.initiatorPerson,
				initiatorOrganizationItem: processMutation.process.initiatorOrganizationItem,
			},
			processMutation.process.createdAt,
		)

		await tx
			.update(workflowProcessMutations)
			.set({ data })
			.where(eq(workflowProcessMutations.id, processMutation.id))
	})
})
