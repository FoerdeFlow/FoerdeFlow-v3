import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { mapGender } from 'openslides-client/utils/mapGender'

export default defineEventHandler(async (event) => {
	await checkPermission('persons.update')

	const database = useDatabase()
	const client = useOpenslides()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		person: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(persons).omit({ id: true }).parseAsync(data))

	await database.transaction(async (tx) => {
		const person = await tx.query.persons.findFirst({
			where: eq(persons.id, params.person),
			columns: {
				email: true,
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
			search: [ { saml_id: person.email } ],
		})
		await client.user.update({
			id,
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
	})
})
