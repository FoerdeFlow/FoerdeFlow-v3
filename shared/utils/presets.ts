/**
 * Modes a preset for a mutation field can have.
 *
 * - `prefill`: the field is prefilled with the value, but stays editable
 * - `locked`: the value is mandatory, the field is shown readonly/disabled
 * - `hidden`: the value is mandatory, the field is not shown at all
 */
export type PresetMode = 'prefill' | 'locked' | 'hidden'

export interface Preset {
	mode: PresetMode
	value: unknown
}

export type Presets = Record<string, Preset>

const presetModes: PresetMode[] = [ 'prefill', 'locked', 'hidden' ]

function parsePresetMode(mode: unknown): PresetMode {
	return presetModes.includes(mode as PresetMode) ? mode as PresetMode : 'prefill'
}

/**
 * Parses the presets of a workflow mutation.
 *
 * A preset is either the value itself (which is prefilled and stays editable)
 * or an object of the shape `{ mode, value }`.
 *
 * @param presets - The raw presets, usually read from the database
 * @returns The parsed presets, keyed by the field they apply to
 */
export function parsePresets(presets: unknown): Presets {
	if(typeof presets !== 'object' || presets === null || Array.isArray(presets)) {
		return {}
	}

	return Object.fromEntries(Object.entries(presets).map(([ field, preset ]) => [
		field,
		typeof preset === 'object' && preset !== null && !Array.isArray(preset) && 'value' in preset
			? {
				mode: parsePresetMode((preset as Record<string, unknown>).mode),
				value: (preset as Record<string, unknown>).value,
			}
			: {
				mode: 'prefill' as const,
				value: preset,
			},
	]))
}

/**
 * Returns the mode of the preset for a field, if there is one.
 *
 * @param presets - The parsed presets
 * @param field - The field to look up
 * @returns The mode of the preset or `null` if the field has no preset
 */
export function presetMode(presets: Presets, field: string): PresetMode | null {
	return presets[field]?.mode ?? null
}

/**
 * Checks whether the value of a field is fixed by a preset, meaning that it
 * cannot be changed by the initiator of a process.
 *
 * @param presets - The parsed presets
 * @param field - The field to look up
 * @returns Whether the field is locked or hidden
 */
export function presetFixed(presets: Presets, field: string): boolean {
	const mode = presetMode(presets, field)
	return mode === 'locked' || mode === 'hidden'
}

/**
 * Tokens that are resolved to a date when a preset is applied, so that a
 * workflow can prefill dates that move with the calendar.
 */
export const presetDateTokens = {
	'@currentMonthStart': (now: Date) => new Date(now.getFullYear(), now.getMonth(), 1),
	'@currentMonthEnd': (now: Date) => new Date(now.getFullYear(), now.getMonth() + 1, 0),
	'@nextMonthStart': (now: Date) => new Date(now.getFullYear(), now.getMonth() + 1, 1),
	'@nextMonthEnd': (now: Date) => new Date(now.getFullYear(), now.getMonth() + 2, 0),
} as const

export type PresetDateToken = keyof typeof presetDateTokens

/**
 * Resolves the value of a preset, meaning that a date token is replaced by the
 * date it stands for. Any other value is returned unchanged.
 *
 * @param value - The value of the preset
 * @param now - The date the tokens are resolved relative to
 * @returns The resolved value
 */
export function resolvePresetValue(value: unknown, now: Date = new Date()): unknown {
	if(typeof value !== 'string' || !(value in presetDateTokens)) {
		return value
	}

	return serializeDate(presetDateTokens[value as PresetDateToken](now))
}
