import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelPermit: idSchema,
	}).parseAsync(data))

	const permit = await readTravelPermit(params.travelPermit)

	const database = useDatabase()

	// The claims are only shown in full to those who may read them for the
	// budget, a traveller sees what was claimed on their own permit anyway.
	const claims = await database.query.travelClaims.findMany({
		where: eq(travelClaims.permit, permit.id),
		with: {
			items: {
				columns: {
					claim: false,
				},
				orderBy: (items, { asc }) => [ asc(items.ord) ],
			},
		},
		orderBy: (claims, { asc }) => [ asc(claims.startDate) ],
	})

	return {
		...permit,
		claims: claims.map((claim) => ({
			...claim,
			recipientPerson: permit.claims
				.find((item) => item.id === claim.id)?.recipientPerson ?? null,
		})),
	}
})
