import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import type { PdfSupportedMutationTable } from '#shared/utils/signature'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processSignature: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const processSignature = await database.query.workflowProcessSignatures.findFirst({
		where: eq(workflowProcessSignatures.id, params.processSignature),
		with: {
			signature: true,
		},
		columns: {
			process: true,
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

	const doc = await database.transaction(async (tx) => {
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

		const processMutation = await tx.query.workflowProcessMutations.findFirst({
			where: and(
				eq(workflowProcessMutations.process, processSignature.process),
				eq(workflowProcessMutations.mutation, processSignature.signature.mutation),
			),
			with: {
				mutation: true,
			},
			columns: {
				data: true,
				mutation: false,
			},
		})
		if(!processMutation) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Zugehörige Prozessmutation nicht gefunden',
				data: {
					processSignatureId: params.processSignature,
				},
			})
		}

		const table = processMutation.mutation.table as PdfSupportedMutationTable
		const data = await encodeProcessData(
			tx,
			table,
			processMutation.data as Parameters<typeof encodeProcessData<typeof table>>[2],
		)

		return await pdfEncodeProcessMutation(table, data, {
			signature: {
				name: processSignature.signature.name,
				hint: processSignature.signature.hint,
				lines: processSignature.signature.lines,
			},
		})
	})

	const filename = [
		'Unterschrift',
		processSignature.signature.code.replace(/[^a-z0-9]/gi, '-'),
		params.processSignature.slice(0, 8),
	].join('_') + '.pdf'
	setResponseHeader(
		event,
		'Content-Disposition',
		`inline; filename="${filename}"`,
	)

	return doc.output('blob')
})
