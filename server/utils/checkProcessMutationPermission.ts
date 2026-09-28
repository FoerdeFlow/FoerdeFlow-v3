import { eq } from 'drizzle-orm'

/**
 * Checks whether the current user may correct the data a process carries.
 *
 * Correcting an application rewrites what was applied for, which is why it
 * takes a permission of its own instead of coming along with the right to
 * approve the process. It is also only allowed while the process is still
 * running: once it is completed its mutations have been written to the tables
 * they address, and a later correction of the data would leave the record
 * disagreeing with what actually happened.
 *
 * @param tx - The transaction to read the process in
 * @param processId - The process whose data is to be corrected
 * @throws When the process does not exist, is no longer running or the user may
 * not correct it
 */
export async function checkProcessMutationPermission(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
) {
	await checkPermission('workflowProcessMutations.update')

	const process = await tx.query.workflowProcesses.findFirst({
		where: eq(workflowProcesses.id, processId),
		columns: {
			status: true,
		},
	})
	if(!process) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Prozess nicht gefunden',
			data: {
				processId,
			},
		})
	}
	if(process.status !== 'pending') {
		throw createError({
			statusCode: 409,
			message: 'Der Inhalt eines Prozesses kann nur geändert werden, solange er läuft',
			data: {
				processId,
			},
		})
	}
}
