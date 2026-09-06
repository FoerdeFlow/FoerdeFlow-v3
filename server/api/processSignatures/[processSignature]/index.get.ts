import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processSignature: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	return await database.transaction(async (tx) => {
		const processSignature = await tx.query.workflowProcessSignatures.findFirst({
			where: eq(workflowProcessSignatures.id, params.processSignature),
			with: {
				signature: {
					with: {
						assigneeOrganizationItem: true,
					},
					columns: {
						assigneeOrganizationItem: false,
					},
				},
			},
			columns: {
				signature: false,
			},
		})
		if(!processSignature) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Unterschrift nicht gefunden',
				data: {
					processSignatureId: params.processSignature,
				},
			})
		}

		await checkProcessPermission(processSignature.process)

		return {
			...processSignature,
			due: await isProcessSignatureDue(
				tx,
				processSignature.process,
				processSignature.signature.stage,
			),
			confirmable: await checkProcessSignaturePermission(tx, processSignature.id)
				.then(() => true)
				.catch(() => false),
		}
	})
})
