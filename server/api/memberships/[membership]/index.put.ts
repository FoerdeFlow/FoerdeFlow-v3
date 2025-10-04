import { createUpdateSchema } from 'drizzle-zod'
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

	await checkPermission('memberships.update', { organizationItem: membership?.organizationItem })

	const membershipSchema = createUpdateSchema(memberships).omit({ id: true, organizationItem: true })
	const body = await readValidatedBody(event, async (body: unknown) => z.strictObject({
		...membershipSchema.shape,
		startDate: z.coerce.date().nullish().optional(),
		endDate: z.coerce.date().nullish().optional(),
	}).parseAsync(body))

	const result = await database
		.update(memberships)
		.set(body)
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
