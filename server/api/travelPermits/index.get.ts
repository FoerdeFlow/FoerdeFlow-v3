import { eq } from 'drizzle-orm'

/** Lists the permits of the user, each with its advance and its claim. */
export default defineEventHandler(async (event) => {
	const person = requireTravelPerson(event)

	return await readTravelPermits(useDatabase(), eq(travelPermits.traveler, person))
})
