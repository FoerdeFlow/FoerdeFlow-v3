import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		bankTransaction: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		assignments: z.array(bankTransactionAssignmentSchema),
	}).parseAsync(data))

	const database = useDatabase()

	const transaction = await database.query.bankTransactions.findFirst({
		where: eq(bankTransactions.id, params.bankTransaction),
		columns: {
			amount: true,
			direction: true,
		},
		with: {
			bankAccount: {
				columns: {
					organizationItem: true,
				},
			},
		},
	})

	await checkPermission('bankTransactions.update', {
		organizationItem: transaction?.bankAccount.organizationItem,
	})

	if(!transaction) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Zahlung nicht gefunden',
			data: {
				bankTransactionId: params.bankTransaction,
			},
		})
	}

	await database.transaction(async (tx) => {
		const assignments = await checkBankTransactionAssignments(
			tx,
			transaction,
			transaction.bankAccount.organizationItem,
			body.assignments,
		)

		await tx
			.delete(bankTransactionAssignments)
			.where(eq(bankTransactionAssignments.transaction, params.bankTransaction))

		if(assignments.length > 0) {
			await tx
				.insert(bankTransactionAssignments)
				.values(assignments.map((assignment) => ({
					...assignment,
					transaction: params.bankTransaction,
				})))
		}
	})
})
