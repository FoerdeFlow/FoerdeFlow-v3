export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const membershipEndReasons = await database.query.membershipEndReasons.findMany()

	return membershipEndReasons
})