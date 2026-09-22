import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		// Die Endung darf mitgeschickt werden, damit die Abo-URL auf `.ics`
		// endet — manche Kalenderprogramme sehen nur darauf.
		token: z.string().min(1).max(64).transform((value) => value.replace(/\.ics$/, '')),
	}).parseAsync(data))

	const database = useDatabase()

	const calendarToken = await database.query.calendarTokens.findFirst({
		where: eq(calendarTokens.token, params.token),
		columns: { id: true, name: true },
	})

	// Dieser Endpunkt prüft bewusst keine Berechtigung: der Feed ist für
	// Kalenderprogramme gedacht, die keine Sitzung mitbringen können. Wer den
	// Token hat, sieht alle Termine. Der Token berechtigt nichts darüber hinaus.
	if(!calendarToken) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kalender nicht gefunden',
		})
	}

	const locationWith = {
		with: { parent: true },
		columns: { parent: false },
	} as const

	const [ eventRows, sessionRows ] = await Promise.all([
		database.query.events.findMany({
			with: {
				organizationItem: true,
				type: true,
				location: locationWith,
				onlineLocation: locationWith,
			},
			columns: { organizationItem: false, type: false, location: false, onlineLocation: false },
		}),
		database.query.sessions.findMany({
			with: { organizationItem: true, location: locationWith, onlineLocation: locationWith },
			columns: { organizationItem: false, location: false, onlineLocation: false },
		}),
	])

	const entries: IcsEvent[] = [
		...eventRows.map((row) => ({
			uid: `event-${row.id}@foerdeflow`,
			summary: row.title,
			start: row.startDate,
			end: row.endDate,
			allDay: row.allDay,
			location: describeLocation(row.location, row.onlineLocation),
			description: row.description,
			conferenceUrl: row.onlineLocation?.url,
			categories: [ row.type.name, row.organizationItem.code ],
			cancelled: row.cancelled,
		})),
		...sessionRows.map((row) => ({
			uid: `session-${row.id}@foerdeflow`,
			summary: `${row.organizationItem.code}-Sitzung ${formatSessionNumber(row.period, row.number)}`,
			start: row.startDate ?? row.plannedDate,
			end: row.endDate,
			location: describeLocation(row.location, row.onlineLocation),
			conferenceUrl: row.onlineLocation?.url,
			categories: [ 'Sitzung', row.organizationItem.code ],
		})),
	].sort((a, b) => a.start.getTime() - b.start.getTime())

	await database
		.update(calendarTokens)
		.set({ lastAccessedAt: sql`now()` })
		.where(eq(calendarTokens.id, calendarToken.id))

	setHeader(event, 'content-type', 'text/calendar; charset=utf-8')
	setHeader(event, 'content-disposition', 'inline; filename="foerdeflow.ics"')
	// Kalenderprogramme fragen den Feed regelmäßig ab; eine zwischengelagerte
	// Antwort würde Terminänderungen verschleppen.
	setHeader(event, 'cache-control', 'no-store')

	return buildIcs(entries, { name: calendarToken.name, now: new Date() })
})
