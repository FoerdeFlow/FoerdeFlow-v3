import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('personDetails.read')

	// Bank details are payment data, so they are only handed out to those who
	// were granted the permission of their own that guards them. Missing it
	// leaves out the IBAN instead of refusing the whole person.
	const bankDetailsVisible = hasPermission('personBankDetails.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		person: idSchema,
	}).parseAsync(data))

	const person = await database.query.persons.findFirst({
		where: eq(persons.id, params.person),
		with: {
			course: {
				with: {
					type: true,
					council: true,
					department: true,
				},
				columns: {
					type: false,
					council: false,
					department: false,
				},
			},
		},
		columns: {
			course: false,
		},
	})

	if(!person) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Person nicht gefunden',
			data: {
				personId: params.person,
			},
		})
	}

	const { iban, ...rest } = person

	return {
		...rest,
		...bankDetailsVisible ? { iban } : {},
		hasPhoto: existsSync(`./data/${params.person}`),
	}
})
