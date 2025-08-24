import { useOpenslides } from '~/server/utils/openslides/useOpenslides'

export default defineTask({
	meta: {
		name: 'openslides:sync',
	},
	async run({ payload, context }) {
		const database = useDatabase()
		const client = useOpenslides()

		const persons = await database.query.persons.findMany({})
		for(const person of persons) {
			const data = {
				first_name: person.callName || person.firstName,
				last_name: person.lastName,
				email: person.email,
				saml_id: person.email,
				username: person.email,
				...(person.pronouns ? { pronoun: person.pronouns } : {}),
			}
			await client.user.create(data)
		}

		return { result: 'success' }
	},
})
