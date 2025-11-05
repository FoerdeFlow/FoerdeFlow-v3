import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('persons.read')
	await checkPermission('persons.create')
	await checkPermission('persons.update')

	const query = await getValidatedQuery(event, async (data) => await z.strictObject({
		email: z.email(),
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		firstName: z.string(),
		lastName: z.string(),
		email: z.email(),
	}).parseAsync(data))

	const database = useDatabase()

	const person = await database.query.persons.findFirst({
		where: (persons, { eq }) => eq(persons.email, query.email),
		columns: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
		},
	})

	if(!person) {
		await $fetch('/api/persons', {
			method: 'POST',
			headers: {
				cookie: getHeader(event, 'cookie') ?? '',
				'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
			},
			body,
		})
		return
	}

	if(person.firstName === body.firstName && person.lastName === body.lastName && person.email === body.email) {
		return
	}

	await $fetch(`/api/persons/${person.id}`, {
		method: 'PUT',
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
		body,
	})
})
