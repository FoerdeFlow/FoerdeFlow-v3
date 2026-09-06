import { eq } from 'drizzle-orm'

/**
 * Recalculates the aggregated paper status of a process from its signatures.
 *
 * This never touches `workflow_processes.status` — completing a process does not
 * depend on the paper trail, and the paper trail does not depend on completion.
 *
 * @param tx - The database connection or transaction to use
 * @param processId - The process to update
 * @returns The paper status that was written
 */
export async function updateProcessPaperStatus(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
) {
	const signatures = await tx.query.workflowProcessSignatures.findMany({
		where: eq(workflowProcessSignatures.process, processId),
		columns: {
			status: true,
		},
	})

	const paperStatus = signatures.length <= 0
		? 'notRequired'
		: signatures.every((signature) => signature.status === 'received')
			? 'received'
			: 'pending'

	await tx
		.update(workflowProcesses)
		.set({ paperStatus })
		.where(eq(workflowProcesses.id, processId))

	return paperStatus
}
