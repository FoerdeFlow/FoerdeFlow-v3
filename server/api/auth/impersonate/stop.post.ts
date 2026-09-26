export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
	const session = await useSession(event, { password: runtimeConfig.sessionSecret })

	/*
	 * Bewusst ohne Rechteprüfung und ohne Abweisung, wenn gar keine fremde
	 * Identität angenommen ist: Der Weg zurück zur eigenen Identität darf nie
	 * blockiert sein, auch nicht nach dem Entzug der Administratorrolle oder bei
	 * einem zweiten Klick. Die eigene Anmeldung bleibt in `userId` erhalten, ein
	 * erneuter Login über den Identitätsanbieter entfällt also.
	 */
	await session.update({ impersonatedUserId: undefined })

	await sendRedirect(event, '/', 303)
})
