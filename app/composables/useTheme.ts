export type ThemePreference = 'system' | 'light' | 'dark'

/**
 * Farbschema-Einstellung der Nutzenden.
 *
 * KERN steuert Light- und Dark-Modus über das Attribut `data-kern-theme` am
 * `<html>`-Element und fällt ohne dieses Attribut auf `prefers-color-scheme`
 * zurück. Die Einstellung wird in einem Cookie gehalten, damit sie schon beim
 * Server-Rendering bekannt ist und kein Umschalt-Flackern entsteht.
 */
export function useTheme() {
	const preference = useCookie<ThemePreference>('ff3-theme', {
		default: () => 'system',
		maxAge: 60 * 60 * 24 * 365,
		sameSite: 'lax',
	})

	// Bei `system` bleibt das Attribut ungesetzt, damit KERN die
	// Betriebssystem-Einstellung auswertet.
	const kernTheme = computed(() =>
		preference.value === 'system' ? undefined : preference.value,
	)

	return {
		kernTheme,
		preference,
	}
}
