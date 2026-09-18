import { createUpdateSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('settings.update')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(settings).omit({ id: true }).parseAsync(data))

	// Als Upsert, damit das Speichern auch dann gelingt, wenn die Zeile fehlt.
	await database
		.insert(settings)
		.values({ ...body, id: 1 })
		.onConflictDoUpdate({
			target: settings.id,
			set: body,
		})
})
