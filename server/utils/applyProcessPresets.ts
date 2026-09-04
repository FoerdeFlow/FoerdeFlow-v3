/**
 * Applies the presets of a workflow mutation to the data submitted for it.
 *
 * Prefilled values are only used if the initiator did not submit a value,
 * while locked and hidden values always replace the submitted value. Date
 * tokens are resolved relative to the moment the process is created.
 *
 * @param data - The data submitted for the mutation
 * @param presets - The raw presets of the mutation
 * @returns The data with the presets applied
 */
export function applyProcessPresets(data: unknown, presets: unknown): unknown {
	const parsed = parsePresets(presets)
	if(
		Object.keys(parsed).length === 0 ||
		typeof data !== 'object' ||
		data === null ||
		Array.isArray(data)
	) {
		return data
	}

	const result: Record<string, unknown> = { ...data }
	for(const [ field, preset ] of Object.entries(parsed)) {
		if(preset.mode === 'prefill' && result[field] !== undefined && result[field] !== null) {
			continue
		}
		result[field] = structuredClone(resolvePresetValue(preset.value))
	}

	return result
}
