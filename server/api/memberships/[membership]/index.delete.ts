import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		membership: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const membership = await database.query.memberships.findFirst({
		where: eq(memberships.id, params.membership),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('memberships.delete', { organizationItem: membership?.organizationItem })

	const result = await database
		.delete(memberships)
		.where(eq(memberships.id, params.membership))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Mitgliedschaft nicht gefunden',
			data: {
				membershipId: params.membership,
			},
		})
	}
})
