import { eq } from 'drizzle-orm'

/**
 * Ensures a signature may be configured for the given workflow mutation.
 *
 * The mutation has to belong to the same workflow as the signature, and its relation
 * needs a PDF encoder — otherwise no document could ever be rendered for signing.
 *
 * @param tx - The database connection or transaction to use
 * @param workflowId - The workflow the signature belongs to
 * @param mutationId - The mutation the signature refers to
 */
export async function checkSignatureMutation(
	tx: ReturnType<typeof useDatabase>,
	workflowId: string,
	mutationId: string,
) {
	const mutation = await tx.query.workflowMutations.findFirst({
		where: eq(workflowMutations.id, mutationId),
		columns: {
			workflow: true,
			table: true,
		},
	})
	if(!mutation) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow-Mutation nicht gefunden',
			data: {
				workflowMutationId: mutationId,
			},
		})
	}

	if(mutation.workflow !== workflowId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Die Mutation gehört nicht zu diesem Workflow',
			data: {
				workflowMutationId: mutationId,
				workflowId,
			},
		})
	}

	if(!isPdfSupportedMutationTable(mutation.table)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Für diese Relation kann kein PDF zur Unterschrift erzeugt werden',
			data: {
				table: mutation.table,
			},
		})
	}
}
