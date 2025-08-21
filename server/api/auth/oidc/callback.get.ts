import { eq } from 'drizzle-orm'
import * as client from 'openid-client'

async function createOrGetPerson(email: string, data: { firstName?: string, lastName?: string }) {
	const database = useDatabase()
	const person = await database.query.persons.findFirst({
		where: eq(persons.email, email),
		columns: {
			id: true,
			firstName: true,
			lastName: true,
		},
	})
	let personId = person?.id
	if(person) {
		if((data.firstName && person.firstName !== data.firstName) || (data.lastName && person.lastName !== data.lastName)) {
			;[ { id: personId } ] = await database
				.update(persons)
				.set(data)
				.where(eq(persons.id, person.id))
				.returning({ id: persons.id })
		}
	} else {
		;[ { id: personId } ] = await database
			.insert(persons)
			.values({
				email,
				firstName: data.firstName || '',
				lastName: data.lastName || '',
			})
			.returning({ id: persons.id })
	}
	return personId!
}

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
	const session = await useSession(event, { password: runtimeConfig.sessionSecret })

	const oidcConfig = await getOidcConfig()
	const codeVerifier = session.data.codeVerifier
	const state = session.data.state

	try {
		const tokens = await client.authorizationCodeGrant(
			oidcConfig,
			getRequestURL(event),
			{
				pkceCodeVerifier: codeVerifier,
				expectedState: state,
			},
		)
		const claims = tokens.claims()
		if(!claims) throw new Error('No claims found in the token')
		const email = claims.email || claims.sub
		if(typeof email !== 'string') throw new Error('Missing email claim (mandatory)')
		const userId = await createOrGetPerson(email, {
			...(typeof claims.given_name === 'string' && claims.given_name.length ? {
				firstName: claims.given_name,
			} : {}),
			...(typeof claims.family_name === 'string' && claims.family_name.length ? {
				lastName: claims.family_name,
			} : {}),
		})
		await session.update({ userId })
		sendRedirect(event, session.data.returnTo, 307)
	} catch(e: any) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			data: e.toString(),
		})
	}
})
