export default defineEventHandler(async (_event) => {
	const database = useDatabase()

	const membershipTypes = await database.query.membershipTypes.findMany()

	return membershipTypes
})
