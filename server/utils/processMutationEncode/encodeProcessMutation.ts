import type jsPDF from 'jspdf'
import type { ProcessMutation, ExpandedProcessMutations } from '~~/server/types/expandedProcessMutations'

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
} as const satisfies Record<ProcessMutation, MutationEncoders<ExpandedProcessMutations[ProcessMutation]>>

export async function encodeProcessMutation<M extends ProcessMutation, F extends EncodingFormat>(
	mutation: M,
	format: F,
	entry: Parameters<(typeof encoders)[M][F]>[0],
) {
	const encoder = encoders[mutation][format]
	if(!encoder) {
		throw new Error(`No encoder found for mutation: ${mutation}, format: ${format}`)
	}
	return await encoder(entry) as ReturnType<(typeof encoders)[M][F]>
}
