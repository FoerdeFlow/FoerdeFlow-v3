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
	assignee: 'initiator' | 'organizationItem' | 'referencedPerson' | 'referencedOrganizationItem'
	assigneeReferencedPerson: string | null
	assigneeOrganizationItem: string | null
	assigneeReferencedOrganizationItem: string | null
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

	if(options.assignee === 'referencedPerson') {
		const person = await readProcessMutationField(
			database,
			options.processId,
			options.assigneeReferencedPerson,
		)
		return person
			? await database.query.persons.findMany({
				where: eq(persons.id, person),
			})
			: []
	}

	if(options.assignee === 'referencedOrganizationItem') {
		const organizationItem = await readProcessMutationField(
			database,
			options.processId,
			options.assigneeReferencedOrganizationItem,
		)
		return organizationItem ? await getEffectiveMembers([ organizationItem ], null) : []
	}

	return []
}
