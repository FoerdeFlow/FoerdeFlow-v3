import { eq } from 'drizzle-orm'

/**
 * Resolves a workflow participant assignment of a process to the persons that
 * actually have to act.
 *
 * Unlike {@link checkParticipantPermission} this does not ask whether someone is
 * *allowed* to act but who is *addressed*. Both differ for administrators, who
 * hold every permission without being an addressee of any step.
 *
 * @param options - The participant assignment together with the process it belongs to
 * @returns The addressed persons, empty when the assignment cannot be resolved
 */
export async function getProcessAssignees(options: {
	assignee: 'initiator' | 'organizationItem' | 'referencedPerson'
	assigneeReferencedPerson: string | null
	assigneeOrganizationItem: string | null
	processId: string
	initiatorType: 'person' | 'organizationItem'
	initiatorPerson: string | null
	initiatorOrganizationItem: string | null
}) {
	const database = useDatabase()

	if(options.assignee === 'organizationItem' && options.assigneeOrganizationItem) {
		return await getEffectiveMembers([ options.assigneeOrganizationItem ], null)
	}

	if(options.assignee === 'initiator') {
		if(options.initiatorType === 'person' && options.initiatorPerson) {
			return await database.query.persons.findMany({
				where: eq(persons.id, options.initiatorPerson),
			})
		}

		if(options.initiatorType === 'organizationItem' && options.initiatorOrganizationItem) {
			return await getEffectiveMembers([ options.initiatorOrganizationItem ], null)
		}
	}

	if(options.assignee === 'referencedPerson' && options.assigneeReferencedPerson) {
		const mutations = await database.query.workflowProcessMutations.findMany({
			where: (mutation, { eq }) => eq(mutation.process, options.processId),
			with: {
				mutation: {
					columns: {
						table: true,
					},
				},
			},
			columns: {
				data: true,
			},
		})

		const [ table, ...steps ] = options.assigneeReferencedPerson.split('.')
		const mutation = mutations.find((m) => m.mutation.table === table)
		if(!mutation) {
			return []
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const field = steps.reduce<any>(
			(acc, step) => acc?.[step] ?? null,
			mutation.data,
		)
		if(typeof field !== 'string') {
			return []
		}

		return await database.query.persons.findMany({
			where: eq(persons.id, field),
		})
	}

	return []
}
