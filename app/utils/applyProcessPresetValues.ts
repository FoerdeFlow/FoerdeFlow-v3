const dateFields = [ 'startDate', 'endDate' ]

function clonePresetValue(field: string, value: unknown): unknown {
	if(dateFields.includes(field) && typeof value === 'string') {
		return new Date(value)
	}
	if(value === null || typeof value !== 'object') {
		return value
	}
	return JSON.parse(JSON.stringify(value))
}

/**
 * Writes the preset values of a workflow mutation into the model of its form.
 *
 * @param model - The model of the form, modified in place
 * @param presets - The presets of the mutation, resolved by the API
 */
export function applyProcessPresetValues(model: object, presets: unknown): void {
	for(const [ field, preset ] of Object.entries(parsePresets(presets))) {
		if(!(field in model)) continue
		(model as Record<string, unknown>)[field] = clonePresetValue(field, preset.value)
	}
}
