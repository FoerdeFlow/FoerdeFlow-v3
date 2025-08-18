import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()
	const client = useOpenslides()

	const params = await getValidatedRouterParams(event, z.object({
		person: idSchema,
	}).parseAsync)

	const body = await readValidatedBody(event, createUpdateSchema(persons).omit({ id: true }).parseAsync)

	await database.transaction(async (tx) => {
		const result = await tx.update(persons).set(body).where(eq(persons.id, params.person))
		if(result.rowCount === 0) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Person nicht gefunden',
				data: {
					personId: params.person,
				},
			})
		}

		await client.connect()
		const [ [ { id } ] ] = await client.presenters.search_users({
			permission_type: 'organization',
			permission_id: 1,
			search: [ { saml_id: body.email } ],
		})
		await client.user.update({
			id,
			saml_id: body.email,
			username: body.email,
			first_name: body.callName || body.firstName,
			last_name: body.lastName,
			email: body.email,
			...(body.pronouns ? { pronoun: body.pronouns } : {}),
			is_physical_person: true,
			can_change_own_password: false,
		})
	})
})
