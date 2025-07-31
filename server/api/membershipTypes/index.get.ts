export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const membershipTypes = await database.query.membershipTypes.findMany()

	return membershipTypes
})