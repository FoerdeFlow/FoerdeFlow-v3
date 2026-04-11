import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../utils/schema'

let databaseInstance: NodePgDatabase<typeof schema> | null = null

export function setDatabase(db: NodePgDatabase<typeof schema>) {
	databaseInstance = db
}

export function useDatabase() {
	try {
		const event = useEvent()
		return event.context.database as NodePgDatabase<typeof schema>
	} catch(_) {
		if(!databaseInstance) {
			throw new Error('Database instance is not set.')
		}
		return databaseInstance
	}
}
