import type { ExpandedProcessMutations, ProcessMutation } from '~~/server/types/expandedProcessMutations'
import type jsPDF from 'jspdf'

type EncodingFormat = 'html' | 'pdf' | 'title'

interface MutationEncoders<T> {
	html: (entry: T) => string | Promise<string>
	pdf: (entry: T) => Promise<jsPDF>
	title: (entry: T) => string
}

const encoders = {
	budgetPlan: {
		html: htmlEncodeBudgetPlan,
		pdf: pdfEncodeBudgetPlan,
		title: titleEncodeBudgetPlan,
	},
	budgetPlanItem: {
		html: htmlEncodeBudgetPlanItems,
		pdf: pdfEncodeBudgetPlanItems,
		title: titleEncodeBudgetPlanItems,
	},
	expenseAuthorization: {
		html: htmlEncodeExpenseAuthorization,
		pdf: pdfEncodeExpenseAuthorization,
		title: titleEncodeExpenseAuthorization,
	},
	paymentOrder: {
		html: htmlEncodePaymentOrder,
		pdf: pdfEncodePaymentOrder,
		title: titleEncodePaymentOrder,
	},
	longtermContract: {
		html: htmlEncodeLongtermContract,
		pdf: pdfEncodeLongtermContract,
		title: titleEncodeLongtermContract,
	},
	representationAllowance: {
		html: htmlEncodeRepresentationAllowance,
		pdf: pdfEncodeRepresentationAllowance,
		title: titleEncodeRepresentationAllowance,
	},
} as const satisfies { [M in ProcessMutation]: MutationEncoders<ExpandedProcessMutations[M]> }

export async function encodeProcessMutation<M extends ProcessMutation, F extends EncodingFormat>(
	mutation: M,
	format: F,
	entry: Parameters<(typeof encoders)[M][F]>[0],
) {
	// Not every encoder is asynchronous, but the dispatcher hands all of them to
	// its callers the same way, so the result is awaited in any case.
	const encoder = encoders[mutation][format] as (
		entry: Parameters<(typeof encoders)[M][F]>[0],
	) => Promise<Awaited<ReturnType<(typeof encoders)[M][F]>>>
	return await encoder(entry)
}
