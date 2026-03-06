import { eq } from 'drizzle-orm'
import { EventContext } from '../types'

export async function checkProcessPermission(processId: string) {
	const event = useEvent()
	const database = useDatabase()
	let hasPermission = false

	await database.transaction(async (tx) => {
		const process = await tx.query.workflowProcesses.findFirst({
			where: eq(workflowProcesses.id, processId),
			columns: {
				id: true,
				initiatorType: true,
				initiatorPerson: true,
				initiatorOrganizationItem: true,
			},
		})
		if (!process) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Prozess nicht gefunden',
				data: {
					processId,
				},
			})
		}
		if (process.initiatorType === 'person' && process.initiatorPerson === (event.context as EventContext).user?.person?.id) {
			hasPermission = true
			return
		}

		const steps = await tx.query.workflowProcessSteps.findMany({
			where: eq(workflowProcessSteps.process, processId),
			columns: {
				id: true,
			},
		})

		if ((await Promise.all(
			steps.map(async (step) =>
				await checkProcessStepPermission(tx, step.id, false).then(() => true).catch(() => false)
			)
		)).some((hasPermission) => hasPermission)) {
			hasPermission = true
			return
		}
	})

	if (!hasPermission) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Keine Berechtigung für diesen Prozess',
			data: {
				processId,
			},
		})
	}
}