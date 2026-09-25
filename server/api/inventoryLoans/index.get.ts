import type { EventContext } from '~~/server/types'

import { and, eq, inArray, isNotNull, isNull, lt, sql } from 'drizzle-orm'
import z from 'zod'

const statusSchema = z.enum([ 'open', 'overdue', 'returned', 'all' ]).default('open')

export default defineEventHandler(async (event) => {
	// Zwei Sichten auf dieselbe Ressource: die eines Gremiums auf seine
	// Ausleihen, und die einer Person auf ihre eigenen über alle Gremien hinweg.
	// Streng, damit beide Sichten zugleich nicht durchrutschen und stillschweigend
	// als die eine gelesen werden.
	const query = await getValidatedQuery(event, async (data) => await z.union([
		z.strictObject({
			organizationItem: idSchema,
			status: statusSchema,
		}),
		z.strictObject({
			borrower: z.literal('me'),
			status: statusSchema,
		}),
	]).parseAsync(data))

	const database = useDatabase()

	let scope
	if('borrower' in query) {
		// Bewusst ohne `checkPermission`: wer etwas ausgeliehen hat, darf wissen,
		// was er zurückbringen muss, auch ohne `inventoryLoans.read` im
		// herausgebenden Gremium. Die Abfrage ist fest auf ihn eingegrenzt.
		const person = (event.context as EventContext).user?.person?.id
		scope = person ? eq(inventoryLoans.borrower, person) : sql`false`
	} else {
		await checkPermission('inventoryLoans.read', { organizationItem: query.organizationItem })

		// Die Ausleihe kennt ihr Gremium nicht, nur der Gegenstand. Die
		// Unterabfrage grenzt deshalb über den Gegenstand ein.
		scope = inArray(inventoryLoans.item, database
			.select({ id: inventoryItems.id })
			.from(inventoryItems)
			.where(eq(inventoryItems.organizationItem, query.organizationItem)))
	}

	const filters = {
		open: isNull(inventoryLoans.returnedAt),
		overdue: and(isNull(inventoryLoans.returnedAt), lt(inventoryLoans.dueAt, new Date())),
		returned: isNotNull(inventoryLoans.returnedAt),
		all: undefined,
	}

	// Bei den offenen Ausleihen zählt, was als Nächstes fällig wird, sonst die
	// jüngste Ausleihe zuerst.
	const open = query.status === 'open' || query.status === 'overdue'

	const result = await database.query.inventoryLoans.findMany({
		where: and(scope, filters[query.status]),
		with: {
			item: {
				with: {
					organizationItem: true,
					location: {
						with: {
							parent: true,
						},
						columns: {
							parent: false,
						},
					},
				},
				columns: {
					organizationItem: false,
					location: false,
				},
			},
			borrower: true,
			lentBy: true,
			returnedTo: true,
		},
		columns: {
			item: false,
			borrower: false,
			lentBy: false,
			returnedTo: false,
		},
		orderBy: (inventoryLoans, { asc, desc }) => [
			open ? asc(inventoryLoans.dueAt) : desc(inventoryLoans.lentAt),
		],
	})

	return result
})
