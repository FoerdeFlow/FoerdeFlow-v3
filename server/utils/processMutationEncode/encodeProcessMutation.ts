import type { ExpandedProcessMutations, ProcessMutation } from '~~/server/types/expandedProcessMutations'
import type jsPDF from 'jspdf'

type EncodingFormat = 'html' | 'pdf'

interface MutationEncoders<T> {
	html: (entry: T) => string | Promise<string>
	pdf: (entry: T) => Promise<jsPDF>
}

const encoders = {
	expenseAuthorization: {
		html: htmlEncodeExpenseAuthorization,
		pdf: pdfEncodeExpenseAuthorization,
	},
	longtermContract: {
		html: htmlEncodeLongtermContract,
		pdf: pdfEncodeLongtermContract,
	},
} as const satisfies { [M in ProcessMutation]: MutationEncoders<ExpandedProcessMutations[M]> }

export async function encodeProcessMutation<M extends ProcessMutation, F extends EncodingFormat>(
	mutation: M,
	format: F,
	entry: Parameters<(typeof encoders)[M][F]>[0],
) {
	const encoder = encoders[mutation][format]
	return await encoder(entry) as ReturnType<(typeof encoders)[M][F]>
}
