import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('workflowSignatures.create')

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(workflowSignatures)
			.omit({ id: true })
			.extend({ lines: signatureLinesSchema })
			.parseAsync(data))

	const database = useDatabase()

	return await database.transaction(async (tx) => {
		await checkSignatureMutation(tx, body.workflow, body.mutation)

		return await tx
			.insert(workflowSignatures)
			.values(body)
			.returning({ id: workflowSignatures.id })
	})
})
