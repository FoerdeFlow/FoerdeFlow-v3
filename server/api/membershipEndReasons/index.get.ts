export default defineEventHandler(async (_event) => {
	const database = useDatabase()

	const membershipEndReasons = await database.query.membershipEndReasons.findMany()

	return membershipEndReasons
})
