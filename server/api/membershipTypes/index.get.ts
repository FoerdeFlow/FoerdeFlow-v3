export default defineEventHandler(async (_event) => {
	await checkPermission('membershipTypes.read')

	const database = useDatabase()

	const membershipTypes = await database.query.membershipTypes.findMany({
		orderBy: (membershipTypes, { asc }) => [
			asc(membershipTypes.sortOrder),
			asc(membershipTypes.name),
		],
	})

	return membershipTypes
})
