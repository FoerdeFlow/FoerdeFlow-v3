import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		attendance: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const attendance = await database.query.sessionAttendances.findFirst({
		where: eq(sessionAttendances.id, params.attendance),
		with: {
			person: {
				with: {
					course: true,
				},
				columns: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					callName: true,
					gender: true,
					pronouns: true,
				},
			},
			session: true,
		},
		columns: {
			id: false,
			person: false,
			session: false,
		},
	})

	await checkPermission('attendances.read', { organizationItem: attendance?.session.organizationItem })

	if(!attendance) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Anwesenheit nicht gefunden',
			data: {
				attendanceId: params.attendance,
			},
		})
	}

	return {
		...attendance,
		person: {
			...attendance.person,
			hasPhoto: existsSync(`./data/${attendance.person.id}`),
		},
	}
})
