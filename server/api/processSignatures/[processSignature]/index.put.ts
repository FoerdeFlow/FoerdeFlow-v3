import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processSignature: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(workflowProcessSignatures).omit({
			id: true,
			process: true,
			signature: true,
			confirmedBy: true,
			confirmedAt: true,
			modifiedAt: true,
		}).parseAsync(data),
	)

	const database = useDatabase()

	await database.transaction(async (tx) => {
		await checkProcessSignaturePermission(tx, params.processSignature)

		const processSignature = await tx.query.workflowProcessSignatures.findFirst({
			where: eq(workflowProcessSignatures.id, params.processSignature),
			with: {
				signature: {
					columns: {
						stage: true,
					},
				},
			},
			columns: {
				process: true,
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

		if(!await isProcessSignatureDue(
			tx,
			processSignature.process,
			processSignature.signature.stage,
		)) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Die Unterschrift ist noch nicht fällig',
				data: {
					processSignatureId: params.processSignature,
				},
			})
		}

		const confirmed = body.status === 'received'

		await tx
			.update(workflowProcessSignatures)
			.set({
				...body,
				confirmedBy: confirmed
					? (event.context as EventContext).user?.person?.id ?? null
					: null,
				confirmedAt: confirmed ? new Date() : null,
				modifiedAt: new Date(),
			})
			.where(eq(workflowProcessSignatures.id, params.processSignature))

		await updateProcessPaperStatus(tx, processSignature.process)
	})
})
