import { z } from 'zod'

export const bankTransactionAssignmentSchema = z.strictObject({
	type: z.enum([ 'planned', 'reserve', 'transfer' ]).nullish(),
	budgetPlanItem: idSchema.nullish(),
	budget: idSchema.nullish(),
	paymentOrder: idSchema.nullish(),
	amount: z.number().positive().multipleOf(0.01),
	note: z.string().trim().max(256).nullish(),
})

export type BankTransactionAssignmentInput = z.infer<typeof bankTransactionAssignmentSchema>
