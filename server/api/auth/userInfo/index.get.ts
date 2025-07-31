import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
	const database = useDatabase()
	const session = await useSession(event, { password: runtimeConfig.sessionSecret })

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

	return {
		...person,
		permissions: [
			'organizationTypes.read',
			'organizationTypes.create',
			'organizationTypes.update',
			'organizationTypes.delete',
			'membershipTypes.read',
			'membershipTypes.create',
			'membershipTypes.update',
			'membershipTypes.delete',
			'membershipEndReasons.read',
			'membershipEndReasons.create',
			'membershipEndReasons.update',
			'membershipEndReasons.delete',
			'persons.read',
			'persons.create',
			'persons.update',
			'persons.delete',
			'organizationItems.read',
			'organizationItems.create',
			'organizationItems.update',
			'organizationItems.delete',
			'memberships.read',
			'memberships.create',
			'memberships.update',
			'memberships.delete',
		],
	}
})
