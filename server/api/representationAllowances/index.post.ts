import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const { recipients, ...body } = await readValidatedBody(event, async (data) =>
		await z.strictObject({
			...createInsertSchema(representationAllowances).omit({ id: true }).shape,
			recipients: z.array(
				z.strictObject({
					...createInsertSchema(representationAllowanceRecipients)
						.omit({ id: true, representationAllowance: true }).shape,
					amount: z.number().multipleOf(0.01),
				}),
			).min(1),
		}).parseAsync(data))

	await checkPermission(
		'representationAllowances.create',
		{ organizationItem: body.organizationItem },
	)

	const database = useDatabase()

	return await database.transaction(async (tx) => {
		const [ result ] = await tx
			.insert(representationAllowances)
			.values(body)
			.returning({ id: representationAllowances.id })

		if(!result) {
			throw createError({
				statusCode: 500,
				statusMessage: 'Aufwandsentschädigung konnte nicht erstellt werden',
			})
		}

		for(const recipient of recipients) {
			await tx
				.insert(representationAllowanceRecipients)
				.values({
					...recipient,
					representationAllowance: result.id,
				})
		}

		return result
	})
})
