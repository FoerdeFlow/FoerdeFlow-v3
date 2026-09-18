/**
 * Liefert die Einstellungen der Instanz.
 *
 * Bewusst ohne Berechtigungsprüfung: die Angaben erscheinen im Impressum sowie
 * in der Datenschutz- und Barrierefreiheitserklärung und müssen deshalb auch
 * ohne Anmeldung abrufbar sein.
 */
export default defineEventHandler(async () => {
	const database = useDatabase()

	const existing = await database.query.settings.findFirst()
	if(existing) return existing

	// Die Zeile legt die Migration an. Fehlt sie doch, wird sie hier mit
	// Leerwerten ergänzt, damit die Seiten weiterhin ausgeliefert werden.
	await database
		.insert(settings)
		.values({ id: 1 })
		.onConflictDoNothing()

	const created = await database.query.settings.findFirst()
	if(!created) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Einstellungen konnten nicht geladen werden',
		})
	}
	return created
})
