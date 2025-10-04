import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		attendance: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const attendance = await database.query.sessionAttendances.findFirst({
		where: eq(sessionAttendances.id, params.attendance),
		with: {
			session: {
				columns: {
					organizationItem: true,
				},
			},
		},
		columns: {},
	})

	await checkPermission('attendances.delete', { organizationItem: attendance?.session.organizationItem })

	const result = await database
		.delete(sessionAttendances)
		.where(eq(sessionAttendances.id, params.attendance))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Anwesenheit nicht gefunden',
			data: {
				attendanceId: params.attendance,
			},
		})
	}
})
