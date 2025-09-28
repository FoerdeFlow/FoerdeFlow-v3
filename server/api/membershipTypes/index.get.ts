export default defineEventHandler(async (_event) => {
	await checkPermission('membershipTypes.read')

	const database = useDatabase()

	const membershipTypes = await database.query.membershipTypes.findMany()

	return membershipTypes
})
