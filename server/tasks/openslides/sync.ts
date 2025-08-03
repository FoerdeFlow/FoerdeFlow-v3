export default defineTask({
	meta: {
		name: 'openslides:sync',
	},
	async run({ payload, context }) {
		const runtimeConfig = useRuntimeConfig()
		const database = useDatabase()

		const persons = await database.query.persons.findMany({})
		for(const person of persons) {
			const openslidesUserId = await createOrUpdateOpenslidesUser({
				firstName: person.firstName,
				lastName: person.lastName,
				email: person.email,
				...(person.callName ? { callName: person.callName } : {}),
				...(person.pronouns ? { pronouns: person.pronouns } : {}),
			})
		}

		return { result: 'success' }
	},
})