import { eq } from 'drizzle-orm'

import type { EventContext } from '../types'

/**
 * Checks whether the current user may see a process, inside a transaction that
 * is already open.
 *
 * @param tx - The transaction to read the process in
 * @param processId - The process to check
 * @throws When the process does not exist or the user may not see it
 */
export async function checkProcessPermissionTx(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
) {
	const event = useEvent()

	const process = await tx.query.workflowProcesses.findFirst({
		where: eq(workflowProcesses.id, processId),
		columns: {
			id: true,
			initiatorType: true,
			initiatorPerson: true,
			initiatorOrganizationItem: true,
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
	if(
		process.initiatorType === 'person' &&
		process.initiatorPerson === (event.context as EventContext).user?.person?.id
	) {
		return
	}
	if(
		process.initiatorType === 'organizationItem' &&
		(event.context as EventContext).user?.memberships?.some((membership) =>
			membership.organizationItem.id === process.initiatorOrganizationItem,
		)
	) {
		return
	}

	const steps = await tx.query.workflowProcessSteps.findMany({
		where: eq(workflowProcessSteps.process, processId),
		columns: {
			id: true,
		},
	})

	const hasPermission = (await Promise.all(
		steps.map(async (step) =>
			await checkProcessStepPermission(tx, step.id, false)
				.then(() => true)
				.catch(() => false),
		),
	)).some((permission) => permission)

	if(!hasPermission) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Keine Berechtigung für diesen Prozess',
			data: {
				processId,
			},
		})
	}
}

export async function checkProcessPermission(processId: string) {
	const database = useDatabase()

	await database.transaction(async (tx) => {
		await checkProcessPermissionTx(tx, processId)
	})
}
