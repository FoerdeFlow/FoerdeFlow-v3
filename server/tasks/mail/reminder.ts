import { eq } from 'drizzle-orm'

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

		const recipients = await getProcessAssignees({
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
