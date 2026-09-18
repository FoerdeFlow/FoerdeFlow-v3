/**
 * Einstellungen der Instanz.
 *
 * Die Angaben werden von der Kopf- und Fußzeile sowie von Impressum,
 * Datenschutz- und Barrierefreiheitserklärung gebraucht. Über den gemeinsamen
 * Schlüssel teilen sich alle Aufrufe dieselbe Anfrage.
 */
export function useSettings() {
	const { data: settings, refresh } = useFetch('/api/settings', {
		key: 'settings',
	})

	/**
	 * Anzahl der noch nicht gepflegten Pflichtangaben je Seite.
	 *
	 * Die Umsatzsteuer-Identifikationsnummer fehlt hier bewusst: sie ist nur
	 * anzugeben, wenn eine vorliegt.
	 */
	const missing = computed(() => {
		const item = settings.value
		const count = (values: (string | undefined)[]) =>
			values.filter((value) => !value).length

		return {
			imprint: count([
				item?.providerName,
				item?.providerLegalForm,
				item?.providerAddress,
				item?.representedBy,
				item?.contactEmail,
				item?.contactPhone,
				item?.supervisoryAuthority,
				item?.responsibleForContent,
			]),
			privacy: count([
				item?.privacyController,
				item?.privacyOfficer,
				item?.privacyPurposes,
				item?.privacyRetention,
				item?.privacyRecipients,
				item?.privacyAuthority,
			]),
			accessibility: count([
				item?.accessibilityConformance,
				item?.accessibilityNonAccessible,
				item?.accessibilityCreatedAt,
				item?.accessibilityReviewedAt,
				item?.accessibilityReviewMethod,
				item?.accessibilityFeedbackContact,
				item?.accessibilityArbitrationBody,
				item?.accessibilityEasyLanguage,
				item?.accessibilitySignLanguage,
			]),
		}
	})

	return {
		missing,
		refresh,
		settings,
	}
}
