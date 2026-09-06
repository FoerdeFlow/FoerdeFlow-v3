import type { H3Event } from 'h3'

import { unlink, writeFile } from 'node:fs/promises'
import { z } from 'zod'

/** Drafts are saved over and over again, so their size is capped. */
const dataSizeLimit = 256 * 1024
const attachmentSizeLimit = 20 * 1024 * 1024

const attachmentPrefix = 'attachment_'

/**
 * Reads the multipart body of a draft of a process.
 *
 * Unlike a process, a draft is not validated against the schemas of its
 * mutations. It is unfinished by definition, so its form data is only checked
 * for its size and stored as it is.
 *
 * @param event - The event of the request
 * @returns The meta data of the draft and the attachments that came with it
 */
export async function readProcessDraftBody(event: H3Event) {
	const formData = await readMultipartFormData(event)
	if(!formData) {
		throw createError({
			statusCode: 400,
			message: 'Expected multipart form data',
		})
	}

	const dataEntry = formData.find((entry) => entry.name === 'data')
	if(!dataEntry) {
		throw createError({
			statusCode: 400,
			message: 'Missing data field in form data',
		})
	}
	if(dataEntry.data.length > dataSizeLimit) {
		throw createError({
			statusCode: 400,
			message: 'Der Entwurf ist zu groß, um gespeichert zu werden',
		})
	}

	const body = await z.strictObject({
		workflow: idSchema,
		initiatorType: z.enum([ 'person', 'organizationItem' ]).nullable(),
		initiatorOrganizationItem: idSchema.nullable(),
		data: z.looseObject({}),
	}).parseAsync(JSON.parse(dataEntry.data.toString('utf8')))

	const attachments: Record<string, Buffer> = {}
	for(const entry of formData) {
		if(!entry.name?.startsWith(attachmentPrefix)) continue

		const attachment = entry.name.substring(attachmentPrefix.length)
		if(!/^[a-zA-Z0-9_-]+$/.test(attachment)) {
			throw createError({
				statusCode: 400,
				message: `Ungültiger Name für den Anhang ${attachment}`,
			})
		}
		if(entry.data.length > attachmentSizeLimit) {
			throw createError({
				statusCode: 400,
				message: 'Der Anhang ist zu groß, um gespeichert zu werden',
			})
		}
		attachments[attachment] = entry.data
	}

	return { body, attachments }
}

/**
 * Checks whether the current user may save a draft for the initiator they
 * picked. The allowed initiators of the workflow are not checked here, a draft
 * is not a request yet and creating the process checks them anyway.
 *
 * @param body - The meta data of the draft
 */
export async function checkProcessDraftInitiatorPermission(
	body: Awaited<ReturnType<typeof readProcessDraftBody>>['body'],
) {
	await checkPermission('workflowProcesses.create')

	if(body.initiatorType === 'organizationItem' && body.initiatorOrganizationItem) {
		await checkPermission(
			'workflowProcesses.create',
			{ organizationItem: body.initiatorOrganizationItem },
			{ exactScopeMatch: true },
		)
	}
}

/**
 * Writes the attachments of a draft and removes the files of the attachments
 * that are no longer part of it.
 *
 * The wizard keeps every attachment in memory and sends all of them with each
 * save, so everything that is missing from the request was removed.
 *
 * @param draftId - The draft the attachments belong to
 * @param previousData - The `data` column of the draft before this request
 * @param attachments - The files that came with the request
 */
export async function writeProcessDraftAttachments(
	draftId: string,
	previousData: unknown,
	attachments: Record<string, Buffer>,
) {
	const previous = parseProcessDraftData(previousData).attachments

	for(const attachment of Object.keys(previous)) {
		if(attachment in attachments) continue
		await unlink(processDraftAttachmentPath(draftId, attachment))
			.catch(() => { /* ignore */ })
	}

	for(const [ attachment, file ] of Object.entries(attachments)) {
		await writeFile(processDraftAttachmentPath(draftId, attachment), file)
	}
}
