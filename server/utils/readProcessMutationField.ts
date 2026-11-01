/**
 * Reads a field of the data of a process by a reference such as
 * `travelPermits.organizationItem`: the table of the mutation, then the keys
 * down to the field.
 *
 * @param tx - The database connection or transaction to use
 * @param processId - The process whose data is read
 * @param reference - The table and the path to the field, separated by dots
 * @returns The id the field holds, `null` if the reference leads nowhere
 */
export async function readProcessMutationField(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
	reference: string | null,
) {
	const [ table, ...steps ] = reference?.split('.') ?? []
	if(!table || steps.length === 0) return null

	const mutations = await tx.query.workflowProcessMutations.findMany({
		where: (mutation, { eq }) => eq(mutation.process, processId),
		with: {
			mutation: {
				columns: {
					table: true,
				},
			},
		},
		columns: {
			data: true,
		},
	})

	let field: unknown = mutations.find((mutation) => mutation.mutation.table === table)?.data
	for(const step of steps) {
		field = typeof field === 'object' && field !== null
			? (field as Record<string, unknown>)[step]
			: undefined
	}

	return typeof field === 'string' ? field : null
}
