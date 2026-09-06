import type { EventContext } from '~~/server/types'

export default defineEventHandler(async (event) => {
	const { body, attachments } = await readProcessDraftBody(event)
	await checkProcessDraftInitiatorPermission(body)

	const person = (event.context as EventContext).user?.person?.id
	if(!person) {
		throw createError({
			statusCode: 403,
			message: 'Entwürfe können nur mit einem Personenkonto gespeichert werden',
		})
	}

	const database = useDatabase()

	const [ result = null ] = await database
		.insert(workflowProcessDrafts)
		.values({
			workflow: body.workflow,
			owner: person,
			initiatorType: body.initiatorType,
			initiatorOrganizationItem: body.initiatorOrganizationItem,
			data: body.data,
		})
		.returning({ id: workflowProcessDrafts.id })
	if(!result) {
		throw createError({
			statusCode: 400,
			message: 'Entwurf konnte nicht gespeichert werden',
		})
	}

	await writeProcessDraftAttachments(result.id, null, attachments)

	return result
})
