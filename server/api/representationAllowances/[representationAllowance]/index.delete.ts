import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		representationAllowance: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const representationAllowance = await database.query.representationAllowances.findFirst({
		where: eq(representationAllowances.id, params.representationAllowance),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission(
		'representationAllowances.delete',
		{ organizationItem: representationAllowance?.organizationItem },
	)

	const result = await database
		.delete(representationAllowances)
		.where(eq(representationAllowances.id, params.representationAllowance))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Aufwandsentschädigung nicht gefunden',
			data: {
				representationAllowanceId: params.representationAllowance,
			},
		})
	}
})
