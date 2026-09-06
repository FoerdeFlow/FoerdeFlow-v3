/** The version the current encoder writes into a draft. */
export const processDraftVersion = 1

/** The metadata of an attachment of a draft, its file is stored separately. */
export interface ProcessDraftAttachment {
	name: string
	type: string
	size: number
}

/** The payload a draft of a process stores in its `data` column. */
export interface ProcessDraftData {
	version: number
	initiatorOrganizationItem: unknown
	model: Record<string, Record<string, unknown>>
	attachments: Record<string, ProcessDraftAttachment>
}

function readRecord(value: unknown): Record<string, unknown> | null {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
		? value as Record<string, unknown>
		: null
}

/**
 * Reads the payload of a draft defensively, so that a draft that was written
 * by an older version of the encoder never breaks a page.
 *
 * @param data - The `data` column of the draft
 * @returns The payload with every part guaranteed to be present
 */
export function parseProcessDraftData(data: unknown): ProcessDraftData {
	const source = readRecord(data) ?? {}

	return {
		version: typeof source.version === 'number' ? source.version : 0,
		initiatorOrganizationItem: source.initiatorOrganizationItem ?? null,
		model: (readRecord(source.model) ?? {}) as ProcessDraftData['model'],
		attachments: (readRecord(source.attachments) ?? {}) as ProcessDraftData['attachments'],
	}
}

/**
 * Derives the title a draft is listed with from the first form model that
 * already has one.
 *
 * @param data - The `data` column of the draft
 * @returns The title or `null` if none has been entered yet
 */
export function processDraftTitle(data: unknown): string | null {
	for(const entry of Object.values(parseProcessDraftData(data).model)) {
		const title = readRecord(entry)?.title
		if(typeof title === 'string' && title) return title
	}
	return null
}
