import type jsPDF from 'jspdf'

import type { PdfEncoderOptions } from './pdfEncoder/types'

/**
 * Renders the data of a process mutation as a PDF document.
 *
 * @param table - The table of the mutation, e.g. `expenseAuthorizations`
 * @param data - The mutation data expanded by {@link encodeProcessData}
 * @param options - Layout options passed through to the encoder
 * @returns The rendered document
 */
export async function pdfEncodeProcessMutation(
	table: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any,
	options: PdfEncoderOptions = {},
): Promise<jsPDF> {
	switch(table) {
		case 'budgetPlans':
			return await pdfEncodeBudgetPlan(data, options)
		case 'expenseAuthorizations':
			return await pdfEncodeExpenseAuthorization(data, options)
		case 'longtermContracts':
			return await pdfEncodeLongtermContract(data, options)
		case 'representationAllowances':
			return await pdfEncodeRepresentationAllowance(data, options)
		default:
			throw createError({
				statusCode: 400,
				statusMessage: 'Für diese Relation kann kein PDF erzeugt werden',
				data: {
					table,
				},
			})
	}
}
