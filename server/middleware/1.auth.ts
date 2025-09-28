import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
	const database = useDatabase()
	const session = await useSession(event, { password: runtimeConfig.sessionSecret })

	if(!session.data.userId) {
		const roles = await getAnonymousRoles()
		const permissions = (await Promise.all(
			roles.map((role) => getRolePermissions(role.id)),
		)).flat().map((permission) => permission.permission)

		event.context.user = {
			roles,
			permissions,
		}
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
		? availablePermissions
		: (await Promise.all(
			roles.map(async (role) => await getRolePermissions(role.id)),
		)).flat().map((permission) => permission.permission)

	event.context.user = {
		person,
		memberships,
		roles,
		permissions,
	}
})
