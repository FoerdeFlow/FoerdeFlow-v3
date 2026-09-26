import type { EventContext } from '../types'

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
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
	} else if(getHeader(event, 'x-foerdeflow-api-key')) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			data: 'Invalid API key',
		})
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

	/*
	 * Die echte Identität wird immer zuerst aufgebaut, denn sie entscheidet, ob
	 * eine angenommene Identität überhaupt gelten darf.
	 */
	const realUser = await buildUserInfo(session.data.userId)
	if(!realUser) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
			data: 'User is not authenticated',
		})
	}

	if(session.data.impersonatedUserId) {
		/*
		 * Nur Administratoren dürfen eine fremde Identität annehmen. Die Prüfung
		 * erfolgt bei jedem Request neu, damit eine entzogene Administratorrolle
		 * die laufende Impersonation sofort beendet.
		 */
		const impersonatedUser = realUser.roles.some((role) => role.isAdmin)
			? await buildUserInfo(session.data.impersonatedUserId)
			: null

		if(impersonatedUser) {
			/*
			 * Der Kontext stammt vollständig von der angenommenen Identität, damit
			 * auch der Administratorkurzschluss in `checkPermission` nur noch deren
			 * Rollen sieht. `impersonator` dient allein der Anzeige.
			 */
			event.context.user = {
				...impersonatedUser,
				impersonator: {
					id: realUser.person.id,
					displayName: realUser.person.displayName,
				},
			} satisfies EventContext['user']
			return
		}

		/*
		 * Administratorrolle entzogen oder Zielperson gelöscht: Die angenommene
		 * Identität verfällt und wird aus der Session entfernt, damit sie nicht
		 * später wieder greift. Eine Abweisung wäre hier falsch, weil der echte
		 * Nutzer sonst ausgesperrt bliebe und die Impersonation gar nicht mehr
		 * beenden könnte.
		 */
		await session.update({ impersonatedUserId: undefined })
	}

	event.context.user = realUser satisfies EventContext['user']
})
