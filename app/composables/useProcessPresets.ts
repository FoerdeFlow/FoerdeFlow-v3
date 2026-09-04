import type { PresetMode } from '#shared/utils/presets'

/**
 * Provides the state a process form needs to honour the presets of its
 * mutation.
 *
 * @param presets - The presets of the mutation, resolved by the API
 * @param readonly - Whether the whole form is readonly
 * @returns The helpers to determine the state of a field
 */
export function useProcessPresets(
	presets: () => unknown,
	readonly: () => boolean | undefined = () => false,
) {
	const parsed = computed(() => parsePresets(presets()))

	const mode = (field: string): PresetMode | null => presetMode(parsed.value, field)

	return {
		presets: parsed,
		mode,

		/** Whether the value of the field is fixed by the preset. */
		fixed: (field: string) => presetFixed(parsed.value, field),

		/** Whether at least one of the fields is shown to the initiator. */
		visible: (...fields: string[]) => presetVisible(parsed.value, ...fields),

		/** Whether the fields may not be edited by the initiator. */
		readonly: (...fields: string[]) => readonly() === true ||
			fields.every((field) => presetFixed(parsed.value, field)),
	}
}
