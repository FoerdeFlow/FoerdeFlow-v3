import { eq } from 'drizzle-orm'
import type { EventContext } from '../types'

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
	const database = useDatabase()
	const session = await useSession(event, { password: runtimeConfig.sessionSecret })

	if(getHeader(event, 'x-foerdeflow-api-key') === runtimeConfig.apiKey) {
		event.context.user = {
			roles: [
				{
					id: 'api-key',
					code: 'API',
					name: 'Administrative access via API key',
					isAdmin: true,
				},
			],
			permissions: availablePermissions.map((permission) => ({
				permission: permission.id,
				organizationItem: false,
			})),
		} satisfies EventContext['user']
		return
	}

	if(!session.data.userId) {
		const roles = await getAnonymousRoles()
		const permissions = (await Promise.all(
			roles.map((role) => getRolePermissions(role.id)),
		)).flat()

		event.context.user = {
			roles,
			permissions,
		} satisfies EventContext['user']
		return
	}

	const person = await database.query.persons.findFirst({
		where: eq(persons.id, session.data.userId),
	})
	if(!person) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			data: 'User is not authenticated',
		})
	}

	const memberships = await getEffectiveMemberships({
		type: 'person',
		person: person.id,
	})
	const roles = await getPersonRoles(person.id)
	const permissions = roles.some((role) => role.isAdmin)
		? availablePermissions.map((permission) => ({
			permission: permission.id,
			organizationItem: false,
		}))
		: (await Promise.all(
			roles.map(async (role) => await getRolePermissions(role.id)),
		)).flat()

	event.context.user = {
		person,
		memberships,
		roles,
		permissions,
	} satisfies EventContext['user']
})
