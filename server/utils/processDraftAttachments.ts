import { unlink } from 'node:fs/promises'

/**
 * The prefix of the files of a draft. It keeps them out of reach of the
 * attachment route of a process, which only accepts a UUID in front of the
 * name of the attachment.
 */
const draftPrefix = 'draft_'

/**
 * Builds the path an attachment of a draft is stored at.
 *
 * @param draftId - The draft the attachment belongs to
 * @param attachment - The name of the attachment
 * @returns The path of the file
 */
export function processDraftAttachmentPath(draftId: string, attachment: string) {
	return `./data/${draftPrefix}${draftId}_${attachment}`
}

/**
 * Removes every file of a draft. Missing files are ignored, a draft may be
 * discarded before its attachments were ever written.
 *
 * @param draftId - The draft whose files are removed
 * @param data - The `data` column of the draft, it lists the attachments
 */
export async function removeProcessDraftAttachments(draftId: string, data: unknown) {
	for(const attachment of Object.keys(parseProcessDraftData(data).attachments)) {
		await unlink(processDraftAttachmentPath(draftId, attachment))
			.catch(() => { /* ignore */ })
	}
}
