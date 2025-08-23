import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as schema from '../utils/schema'

export function useDatabase() {
	const event = useEvent()
	return event.context.database as NodePgDatabase<typeof schema>
}
