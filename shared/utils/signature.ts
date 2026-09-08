export const pdfSupportedMutationTables = [
	'budgetPlans',
	'expenseAuthorizations',
	'paymentOrders',
	'longtermContracts',
	'representationAllowances',
] as const

export type PdfSupportedMutationTable = typeof pdfSupportedMutationTables[number]

/**
 * Checks whether a workflow mutation relation can be rendered as a PDF.
 *
 * @param table - The table of the mutation, e.g. `expenseAuthorizations`
 * @returns Whether a PDF encoder exists for the relation
 */
export function isPdfSupportedMutationTable(table: string): table is PdfSupportedMutationTable {
	return (pdfSupportedMutationTables as readonly string[]).includes(table)
}
