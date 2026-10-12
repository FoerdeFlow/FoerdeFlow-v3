import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		attendance: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		// Sitzung und Person bleiben fest; sonst könnte ein Eintrag auf eine schon
		// erfasste Kombination umgehängt werden.
		await createUpdateSchema(sessionAttendances).pick({ status: true }).parseAsync(data))

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

	await checkPermission('attendances.update', { organizationItem: attendance?.session.organizationItem })

	const result = await database
		.update(sessionAttendances)
		.set(body)
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
