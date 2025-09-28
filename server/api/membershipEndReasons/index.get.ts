export default defineEventHandler(async (_event) => {
	await checkPermission('membershipEndReasons.read')

	const database = useDatabase()

	const membershipEndReasons = await database.query.membershipEndReasons.findMany()

	return membershipEndReasons
})
