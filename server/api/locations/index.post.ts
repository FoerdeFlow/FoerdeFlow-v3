export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) =>
		await locationBodySchema.parseAsync(data))

	if(body.type === 'adHoc') {
		// Wer im Gremium einen Termin oder eine Sitzung anlegen darf, soll daran
		// nicht scheitern, weil der Ort noch im Katalog fehlt.
		const allowed =
			hasPermission('events.create', { organizationItem: body.organizationItem }) ||
			hasPermission('sessions.create', { organizationItem: body.organizationItem })
		if(!allowed) {
			throw createError({
				statusCode: 403,
				statusMessage: 'Forbidden',
				data: 'User does not have the required permission',
			})
		}
	} else {
		await checkPermission('locations.create')
	}

	const database = useDatabase()

	await checkLocationParent(database, body)

	const [ result = null ] = await database
		.insert(locations)
		.values(toLocationValues(body))
		.returning({ id: locations.id })

	if(result === null) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Ort konnte nicht erstellt werden',
		})
	}

	return result
})
