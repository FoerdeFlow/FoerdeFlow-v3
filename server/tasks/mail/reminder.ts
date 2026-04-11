import { eq } from 'drizzle-orm'

async function getEffectiveAssignees(options: {
	assignee: 'initiator' | 'organizationItem' | 'referencedPerson',
	assigneeReferencedPerson: string | null,
	assigneeOrganizationItem: string | null,
	processId: string,
	initiatorType: 'person' | 'organizationItem',
	initiatorPerson: string | null,
	initiatorOrganizationItem: string | null,
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

function replacePlaceholders(template: string, data: Record<string, string>): string {
	return template.replaceAll(/{{\s*([^}]+)\s*}}/g, (_, key) => data[key] ?? '')
}

async function checkProcessReminder(process: {
	id: string
	initiatorType: 'person' | 'organizationItem'
	initiatorPerson: string | null
	initiatorOrganizationItem: string | null
	createdAt: Date
}) {
	const runtimeConfig = useRuntimeConfig()
	const database = useDatabase()

	await database.transaction(async (tx) => {
		const steps = await tx.query.workflowProcessSteps.findMany({
			where: (step, { eq }) => eq(step.process, process.id),
			with: {
				step: {
					columns: {
						type: true,
						assignee: true,
						assigneeOrganizationItem: true,
						assigneeReferencedPerson: true,
						reminderEnabled: true,
						reminderInterval: true,
						reminderDelay: true,
						reminderReplyTo: true,
						reminderSubject: true,
						reminderMessage: true,
					},
				},
			},
			columns: {
				id: true,
				status: true,
				modifiedAt: true,
				reminderSentAt: true,
			},
			orderBy: (step, { asc, sql }) => asc(
				sql<number>`(
					SELECT stage
					FROM ${workflowSteps} ff3_ws
					WHERE ff3_ws.id = ${step.step}
				)`,
			),
		})

		const currentStepIndex = steps.findIndex((step) => step.status === 'pending')
		if(currentStepIndex === -1) {
			return
		}

		const currentStep = steps[currentStepIndex]
		const previousStep = steps[currentStepIndex - 1]
		const modifiedAt = previousStep?.modifiedAt ?? process.createdAt
		const reminderSentAt = currentStep?.reminderSentAt ?? null
		const now = new Date()

		if(!currentStep?.step.reminderEnabled) {
			return
		}

		if(reminderSentAt) {
			if(now.getTime() - reminderSentAt.getTime() < currentStep.step.reminderInterval * 1000) {
				return
			}
		} else {
			if(now.getTime() - modifiedAt.getTime() < currentStep.step.reminderDelay * 1000) {
				return
			}
		}

		const recipients = await getEffectiveAssignees({
			assignee: currentStep.step.assignee,
			assigneeReferencedPerson: currentStep.step.assigneeReferencedPerson,
			assigneeOrganizationItem: currentStep.step.assigneeOrganizationItem,
			processId: process.id,
			initiatorType: process.initiatorType,
			initiatorPerson: process.initiatorPerson,
			initiatorOrganizationItem: process.initiatorOrganizationItem,
		})

		if(recipients.length === 0) {
			return
		}

		for(const recipient of recipients) {
			const placeholders = {
				name: formatPerson(recipient),
				url: `${runtimeConfig.externalURL}/processes/view/${process.id}`,
			}

			await sendMail({
				to: recipient.email,
				...(currentStep.step.reminderReplyTo
					? {
						replyTo: currentStep.step.reminderReplyTo,
					}
					: {}),
				subject: replacePlaceholders(currentStep.step.reminderSubject, placeholders),
				text: replacePlaceholders(currentStep.step.reminderMessage, placeholders),
			})
		}

		await tx
			.update(workflowProcessSteps)
			.set({ reminderSentAt: new Date() })
			.where(eq(workflowProcessSteps.id, currentStep.id))
	})
}

export default defineTask({
	meta: {
		name: 'mail:reminder',
		description: 'Sends a reminder email to users with pending tasks.',
	},
	async run() {
		const database = useDatabase()

		const processes = await database.query.workflowProcesses.findMany({
			where: (process, { eq }) => eq(process.status, 'pending'),
			columns: {
				id: true,
				initiatorType: true,
				initiatorPerson: true,
				initiatorOrganizationItem: true,
				createdAt: true,
			},
		})

		// This is serial on purpose to reduce the load.
		// Performance is not a concern here.
		for(const process of processes) {
			await checkProcessReminder(process)
		}

		return { result: 'success' }
	},
})
