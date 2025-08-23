import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import * as schema from '../utils/schema'

export default defineNitroPlugin((nitroApp) => {
	const runtimeConfig = useRuntimeConfig()
	const database = drizzle({
		connection: {
			user: runtimeConfig.database.user,
			password: runtimeConfig.database.password,
			host: runtimeConfig.database.host,
			port: runtimeConfig.database.port,
			database: runtimeConfig.database.name,
		},
		casing: 'snake_case',
		schema,
	})

	migrate(database, {
		migrationsFolder: 'server/migrations',
	}).catch((e: unknown) => {
		console.error('Migration failed:', e)
	})

	nitroApp.hooks.hook('request', (event) => {
		event.context.database = database
	})
})
