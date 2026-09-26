import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
	const database = useDatabase()
	const session = await useSession(event, { password: runtimeConfig.sessionSecret })
	const query = await getValidatedQuery(event, async (data) => await z.strictObject({
		person: idSchema,
	}).parseAsync(data))

	/*
	 * Eine angenommene Identität setzt eine echte, über den Identitätsanbieter
	 * angemeldete Person voraus. Zugriffe über den API-Schlüssel haben keine
	 * Session und scheitern deshalb hier.
	 */
	if(!session.data.userId) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Nicht angemeldet',
			data: 'Eine Anmeldung ist erforderlich',
		})
	}

	/*
	 * Verschachteln ist ausgeschlossen: Sonst wäre nicht mehr erkennbar, wer
	 * tatsächlich handelt, und der Weg zurück wäre mehrstufig.
	 */
	if(session.data.impersonatedUserId) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Es ist bereits eine fremde Identität angenommen',
			data: 'Verlassen Sie die angenommene Identität zuerst',
		})
	}

	/*
	 * Kein `checkPermission`: Für die Impersonation gibt es bewusst keine eigene
	 * Berechtigung, sie steht ausschließlich Administratorrollen offen. Die
	 * Middleware hat den Kontext aus der echten Person aufgebaut, weil eine
	 * laufende Impersonation schon oben abgewiesen wurde.
	 */
	const context = event.context as EventContext
	if(!context.user?.roles.some((role) => role.isAdmin)) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Keine Berechtigung',
			data: 'Nur Administratoren können sich als andere Person anmelden',
		})
	}

	if(query.person === session.data.userId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Eine Anmeldung als eigene Person ist nicht möglich',
			data: {
				person: query.person,
			},
		})
	}

	const person = await database.query.persons.findFirst({
		where: eq(persons.id, query.person),
		columns: {
			id: true,
		},
	})
	if(!person) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Person nicht gefunden',
			data: {
				person: query.person,
			},
		})
	}

	await session.update({ impersonatedUserId: person.id })

	/*
	 * Nach dem Wechsel der Identität sind alle geladenen Daten veraltet, daher ein
	 * vollständiger Seitenwechsel. Ziel ist fest die Startseite: Sie ist für jede
	 * angemeldete Person erreichbar, die zuvor besuchte Seite unter Umständen
	 * nicht.
	 */
	await sendRedirect(event, '/', 303)
})
