import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import * as schema from '../utils/schema'

export default defineNitroPlugin(async (nitroApp) => {
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

	await migrate(database, {
		migrationsFolder: 'server/migrations',
	})

	nitroApp.hooks.hook('request', (event) => {
		event.context.database = database
	})
})