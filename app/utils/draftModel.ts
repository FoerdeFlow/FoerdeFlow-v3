import type { ProcessDraftAttachment } from '#shared/utils/processDraft'

interface EncodedDraftModel {
	model: Record<string, Record<string, unknown>>
	attachments: Record<string, ProcessDraftAttachment>
	files: Record<string, File>
}

function encodeDraftValue(
	value: unknown,
	path: string,
	encoded: EncodedDraftModel,
): unknown {
	if(value instanceof Date) {
		return serializeDate(value)
	}
	if(value instanceof File) {
		encoded.files[path] = value
		encoded.attachments[path] = {
			name: value.name,
			type: value.type,
			size: value.size,
		}
		return null
	}
	// Items that were added in this session are identified by a symbol, which
	// JSON cannot carry. They get a new one when the draft is read back.
	if(typeof value === 'symbol' || value === undefined) {
		return null
	}
	if(Array.isArray(value)) {
		return value.map((entry, index) => encodeDraftValue(entry, `${path}_${index}`, encoded))
	}
	if(value === null || typeof value !== 'object') {
		return value
	}
	return Object.fromEntries(Object.entries(value)
		.map(([ field, entry ]) => [ field, encodeDraftValue(entry, `${path}_${field}`, encoded) ]))
}

/**
 * Splits the model of the wizard into the part that can be stored as JSON and
 * the files that have to be uploaded next to it.
 *
 * @param model - The model of the wizard with all of its forms
 * @returns The model without its files, the metadata of the files and the
 * files themselves, keyed by the path they were found at
 */
export function encodeDraftModel(model: Record<string, object>): EncodedDraftModel {
	const encoded: EncodedDraftModel = {
		model: {},
		attachments: {},
		files: {},
	}

	for(const [ key, form ] of Object.entries(model)) {
		encoded.model[key] = encodeDraftValue(form, key, encoded) as Record<string, unknown>
	}

	return encoded
}

function reviveDraftObject(value: object): Record<string, unknown> {
	return Object.fromEntries(Object.entries(value)
		.map(([ field, entry ]) => [ field, reviveDraftValue(field, entry) ]))
}

/**
 * Revives an entry of a list. Entries that were added in the session the draft
 * was saved in lost their symbol, so they get a new one. Without it the inputs
 * would append a copy instead of replacing the entry when it is edited.
 */
function reviveDraftItem(entry: unknown): unknown {
	if(entry === null || typeof entry !== 'object') return entry

	const revived = reviveDraftObject(entry)
	if(typeof revived.id !== 'string') {
		revived.id = Symbol('draftItem')
	}
	return revived
}

function reviveDraftValue(field: string, value: unknown): unknown {
	const revived = reviveFormDate(field, value)
	if(revived instanceof Date) {
		return revived
	}
	if(Array.isArray(revived)) {
		return revived.map((entry) => reviveDraftItem(entry))
	}
	if(revived === null || typeof revived !== 'object') {
		return revived
	}
	return reviveDraftObject(revived)
}

/**
 * Writes the values of a saved draft into the model of a form.
 *
 * Fields the model does not know are skipped, so that a draft still opens
 * after its workflow was changed. Fields the mutation fixes through its
 * presets are skipped as well, the preset always wins over a stored value.
 *
 * @param model - The model of the form, modified in place
 * @param source - The part of the draft that belongs to this form
 * @param presets - The presets of the mutation, resolved by the API
 */
export function applyDraftModelValues(model: object, source: unknown, presets: unknown): void {
	if(typeof source !== 'object' || source === null) return

	const parsed = parsePresets(presets)

	for(const [ field, value ] of Object.entries(source)) {
		if(!(field in model)) continue
		if(presetFixed(parsed, field)) continue
		(model as Record<string, unknown>)[field] = reviveDraftValue(field, value)
	}
}

/**
 * Writes the files of a draft back into the model of a form, after they were
 * loaded from the server.
 *
 * @param model - The model of the form, modified in place
 * @param key - The key the form has in the model of the wizard
 * @param files - The loaded files, keyed by the path they were stored at
 */
export function applyDraftModelFiles(
	model: object,
	key: string,
	files: Record<string, File>,
): void {
	for(const [ path, file ] of Object.entries(files)) {
		if(!path.startsWith(`${key}_`)) continue

		const field = path.substring(key.length + 1)
		if(!(field in model)) continue
		(model as Record<string, unknown>)[field] = file
	}
}
