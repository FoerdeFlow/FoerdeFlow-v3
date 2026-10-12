export default defineEventHandler(async () => {
	await checkPermission('vehicleDrivers.read')

	const database = useDatabase()

	const personColumns = {
		id: true,
		firstName: true,
		lastName: true,
		callName: true,
		pronouns: true,
	} as const

	const result = await database.query.vehicleDriverQualifications.findMany({
		with: {
			person: { columns: personColumns },
			licenseCheckedBy: { columns: personColumns },
			instructedBy: { columns: personColumns },
		},
	})

	return result.map((item) => ({
		...item,
		person: withDisplayName(item.person),
		licenseCheckedBy: withDisplayName(item.licenseCheckedBy),
		instructedBy: withDisplayName(item.instructedBy),
	}))
})
