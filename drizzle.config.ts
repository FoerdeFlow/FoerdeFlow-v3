import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	dialect: 'postgresql',
	schema: './server/schema',
	out: './server/migrations',
	casing: 'snake_case',
	dbCredentials: {
		url: 'postgres://foerdeflow:foerdeflow@localhost:5432/foerdeflow',
	},
})
