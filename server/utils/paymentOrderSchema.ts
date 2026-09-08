import z from 'zod'

/**
 * The IBAN of the recipient of an invoice, checked the same way the one of a
 * person is: the length alone would not catch a typo.
 */
export const paymentOrderIbanSchema = z.string()
	.transform((value) => normalizeIban(value))
	.refine((value) => isValidIban(value), 'Die IBAN ist ungültig')

interface PaymentOrderVariants {
	type?: 'planned' | 'reserve' | null
	budgetPlanItem?: string | null
	budget?: string | null
	recipientType?: 'reimbursement' | 'invoice' | null
	recipientPerson?: string | null
	recipientName?: string | null
	recipientIban?: string | null
	purpose?: string | null
}

/**
 * Checks that both variants of a payment order carry exactly the fields they
 * are made of, so that a wrong combination is refused as invalid input instead
 * of running into the check constraints of the table.
 *
 * @param order - The payment order to check
 * @returns Whether the fields match the type and the recipient type
 */
export function paymentOrderVariantsValid(order: PaymentOrderVariants) {
	const type = order.type ?? 'planned'
	const originValid = type === 'planned'
		? !!order.budgetPlanItem && !order.budget
		: !!order.budget && !order.budgetPlanItem

	const recipientType = order.recipientType ?? 'reimbursement'
	const recipientValid = recipientType === 'reimbursement'
		? !!order.recipientPerson &&
			!order.recipientName && !order.recipientIban && !order.purpose
		: !order.recipientPerson &&
			!!order.recipientName && !!order.recipientIban && !!order.purpose

	return originValid && recipientValid
}
