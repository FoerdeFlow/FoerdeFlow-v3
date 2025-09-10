import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		attendance: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(sessionAttendances).omit({ id: true }).parseAsync(data))

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
