export function titleEncodeLongtermContract(entry: {
	budget: {
		code: string
	} | null
	title: string
}) {
	if(!entry.budget) {
		throw createError({
			status: 500,
			message: 'Invalid longtermContract object (no budget)',
		})
	}

	return `${entry.budget.code} - ${entry.title}`
}
