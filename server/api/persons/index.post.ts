import { createInsertSchema } from 'drizzle-zod'
import { mapGender } from 'openslides-client/utils/mapGender'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('persons.create')

	const database = useDatabase()
	const client = useOpenslides()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(persons).omit({ id: true }).extend({
			// The generated schema would only check the length, so the IBAN is
			// held to the same rules as everywhere else.
			iban: z.string()
				.transform((value) => normalizeIban(value))
				.refine((value) => isValidIban(value), 'Die IBAN ist ungültig')
				.nullable()
				.optional(),
		}).parseAsync(data))

	return await database.transaction(async (tx) => {
		const [ result ] = await tx.insert(persons).values(body).returning({ id: persons.id })

		await client.connect()
		await client.user.create({
			saml_id: body.email,
			username: body.email,
			first_name: body.callName ?? body.firstName,
			last_name: body.lastName,
			email: body.email,
			...(body.gender ? { gender_id: mapGender(body.gender) } : {}),
			...(body.pronouns ? { pronoun: body.pronouns } : {}),
			is_physical_person: true,
			can_change_own_password: false,
		})

		return result
	})
})
