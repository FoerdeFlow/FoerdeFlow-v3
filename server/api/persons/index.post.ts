import { createInsertSchema } from 'drizzle-zod'
import { mapGender } from 'openslides-client/utils/mapGender'

export default defineEventHandler(async (event) => {
	await checkPermission('persons.create')

	const database = useDatabase()
	const client = useOpenslides()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(persons).omit({ id: true }).parseAsync(data))

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
