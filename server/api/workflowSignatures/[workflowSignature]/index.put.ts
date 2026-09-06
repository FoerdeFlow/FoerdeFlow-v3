import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSignatures.update')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		workflowSignature: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(workflowSignatures)
			.omit({ id: true })
			.extend({ lines: signatureLinesSchema.optional() })
			.parseAsync(data))

	const database = useDatabase()

	await database.transaction(async (tx) => {
		const signature = await tx.query.workflowSignatures.findFirst({
			where: eq(workflowSignatures.id, params.workflowSignature),
			columns: {
				workflow: true,
				mutation: true,
			},
		})

		if(!signature) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Unterschrift nicht gefunden',
				data: {
					workflowSignatureId: params.workflowSignature,
				},
			})
		}

		await checkSignatureMutation(
			tx,
			body.workflow ?? signature.workflow,
			body.mutation ?? signature.mutation,
		)

		await tx
			.update(workflowSignatures)
			.set(body)
			.where(eq(workflowSignatures.id, params.workflowSignature))
	})
})
