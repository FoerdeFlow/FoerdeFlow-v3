import { and, eq } from 'drizzle-orm'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		representationAllowance: idSchema,
	}).parseAsync(data))

	const { recipients, ...body } = await readValidatedBody(event, async (data) =>
		await z.strictObject({
			...createUpdateSchema(representationAllowances).omit({ id: true }).shape,
			recipients: z.array(
				z.strictObject({
					id: z.uuid().optional(),
					...createInsertSchema(representationAllowanceRecipients)
						.omit({ id: true, representationAllowance: true }).shape,
					amount: z.number().multipleOf(0.01),
				}),
			).min(1),
		}).parseAsync(data))

	const database = useDatabase()

	const representationAllowance = await database.query.representationAllowances.findFirst({
		where: eq(representationAllowances.id, params.representationAllowance),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission(
		'representationAllowances.update',
		{ organizationItem: representationAllowance?.organizationItem },
	)

	if(
		body.organizationItem !== undefined &&
		representationAllowance &&
		representationAllowance.organizationItem !== body.organizationItem
	) {
		await checkPermission(
			'representationAllowances.update',
			{ organizationItem: body.organizationItem },
		)
	}

	await database.transaction(async (tx) => {
		const result = await tx
			.update(representationAllowances)
			.set(body)
			.where(eq(representationAllowances.id, params.representationAllowance))

		if(result.rowCount === 0) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Aufwandsentschädigung nicht gefunden',
				data: {
					representationAllowanceId: params.representationAllowance,
				},
			})
		}

		const existingRecipients = await tx.query.representationAllowanceRecipients.findMany({
			where: eq(
				representationAllowanceRecipients.representationAllowance,
				params.representationAllowance,
			),
			columns: {
				id: true,
			},
		})

		for(const { id: recipientId, ...recipient } of recipients) {
			if(recipientId) {
				await tx
					.update(representationAllowanceRecipients)
					.set(recipient)
					.where(and(
						eq(representationAllowanceRecipients.id, recipientId),
						eq(
							representationAllowanceRecipients.representationAllowance,
							params.representationAllowance,
						),
					))
			} else {
				await tx
					.insert(representationAllowanceRecipients)
					.values({
						...recipient,
						representationAllowance: params.representationAllowance,
					})
			}
		}

		const deletedRecipients = existingRecipients
			.filter((existingRecipient) =>
				!recipients.some((recipient) => recipient.id === existingRecipient.id))

		for(const deletedRecipient of deletedRecipients) {
			await tx
				.delete(representationAllowanceRecipients)
				.where(eq(representationAllowanceRecipients.id, deletedRecipient.id))
		}
	})
})
