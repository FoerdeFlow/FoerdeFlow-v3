import { eq } from 'drizzle-orm'

/**
 * Checks whether a signature of a process is already due.
 *
 * A signature becomes due once every workflow step of a lower stage has been
 * completed, which mirrors how the stages of `workflow_steps` order the process.
 *
 * @param tx - The database connection or transaction to use
 * @param processId - The process the signature belongs to
 * @param stage - The stage configured for the signature
 * @returns Whether the document may be printed and its receipt confirmed
 */
export async function isProcessSignatureDue(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
	stage: number,
) {
	const steps = await tx
		.select({
			status: workflowProcessSteps.status,
			stage: workflowSteps.stage,
		})
		.from(workflowProcessSteps)
		.innerJoin(workflowSteps, eq(workflowProcessSteps.step, workflowSteps.id))
		.where(eq(workflowProcessSteps.process, processId))

	return steps
		.filter((step) => step.stage < stage)
		.every((step) => step.status === 'completed')
}
