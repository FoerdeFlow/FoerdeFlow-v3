import type z from 'zod'

import { and, eq, gt, inArray, type InferInsertModel, isNull, or } from 'drizzle-orm'
import { copyFile } from 'node:fs/promises'

async function createCandidate(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: z.infer<typeof processSchemas.candidates.create>,
	processMetadata: {
		id: string
		mutationId: string
		initiatorPerson: string
	},
) {
	const [ result ] = await tx
		.insert(electionProposals)
		.values({
			electionCommittee: data.electionCommittee,
			submitter: processMetadata.initiatorPerson,
		})
		.returning({ id: electionProposals.id })

	if(!result) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Wahlvorschlag konnte nicht erstellt werden',
		})
	}

	await tx.update(persons).set({
		matriculationNumber: data.matriculationNumber,
		postalAddress: data.postalAddress,
		callName: data.callName,
		pronouns: data.pronouns,
		course: data.course,
	}).where(eq(persons.id, data.candidate))

	await tx.insert(candidates).values({
		electionProposal: result.id,
		candidate: data.candidate,
		applicationLetter: data.applicationLetter,
	})

	await copyFile(
		`./data/${processMetadata.id}_${processMetadata.mutationId}_photo`,
		`./data/${data.candidate}`,
	)
}

async function createBudgetPlan(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: Omit<
		InferInsertModel<typeof budgetPlans>,
		'id'
	> & {
		items: Omit<
			InferInsertModel<typeof budgetPlanItems>,
			'id' | 'budgetPlan'
		>[]
	},
) {
	const [ result ] = await tx
		.insert(budgetPlans)
		.values(data)
		.returning({ id: budgetPlans.id })

	if(!result) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Haushaltsplan konnte nicht erstellt werden',
		})
	}

	for(const item of data.items) {
		await tx.insert(budgetPlanItems).values({
			...item,
			plan: result.id,
		})
	}
}

async function createExpenseAuthorization(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: Omit<
		InferInsertModel<typeof expenseAuthorizations>,
		'id'
	> & {
		items: Omit<
			InferInsertModel<typeof expenseAuthorizationItems>,
			'id' | 'expenseAuthorization'
		>[]
	},
	processMetadata: {
		meta: unknown
	},
) {
	const type =
		typeof processMetadata.meta === 'object' &&
			processMetadata.meta &&
			'type' in processMetadata.meta &&
			processMetadata.meta.type
			? processMetadata.meta.type as 'planned' | 'reserve'
			: data.type ?? 'planned'

	const [ result ] = await tx
		.insert(expenseAuthorizations)
		.values({ ...data, type })
		.returning({ id: expenseAuthorizations.id })

	if(!result) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Auslagengenehmigung konnte nicht erstellt werden',
		})
	}

	for(const item of data.items) {
		await tx.insert(expenseAuthorizationItems).values({
			...item,
			expenseAuthorization: result.id,
		})
	}
}

async function createLongtermContract(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: Omit<
		InferInsertModel<typeof longtermContracts>,
		'id'
	> & {
		items: Omit<
			InferInsertModel<typeof longtermContractItems>,
			'id' | 'longtermContract'
		>[]
	},
) {
	const [ result ] = await tx
		.insert(longtermContracts)
		.values(data)
		.returning({ id: longtermContracts.id })

	if(!result) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Langzeitvertrag konnte nicht erstellt werden',
		})
	}

	for(const item of data.items) {
		await tx.insert(longtermContractItems).values({
			...item,
			longtermContract: result.id,
		})
	}
}

function previousDay(date: string) {
	const value = new Date(date)
	if(Number.isNaN(value.getTime())) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Ungültiges Startdatum der Aufwandsentschädigung',
			data: { startDate: date },
		})
	}

	value.setUTCDate(value.getUTCDate() - 1)
	return value.toISOString().slice(0, 10)
}

async function createRepresentationAllowance(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: Omit<
		InferInsertModel<typeof representationAllowances>,
		'id'
	> & {
		recipients: Omit<
			InferInsertModel<typeof representationAllowanceRecipients>,
			'id' | 'representationAllowance'
		>[]
	},
) {
	if(data.periodUnit !== 'once') {
		const endDate = previousDay(data.startDate)

		const running = await tx.query.representationAllowances.findMany({
			where: and(
				eq(representationAllowances.organizationItem, data.organizationItem),
				eq(representationAllowances.periodUnit, 'month'),
				or(
					isNull(representationAllowances.endDate),
					gt(representationAllowances.endDate, endDate),
				),
			),
			columns: {
				id: true,
				startDate: true,
			},
		})

		const conflicting = running.find((item) => item.startDate >= endDate)
		if(conflicting) {
			throw createError({
				statusCode: 409,
				statusMessage: 'Die bestehende Aufwandsentschädigung kann nicht zum Tag vor ' +
					'Inkrafttreten der neuen beendet werden, weil sie nicht früher beginnt',
				data: {
					representationAllowanceId: conflicting.id,
					existingStartDate: conflicting.startDate,
					newEndDate: endDate,
				},
			})
		}

		if(running.length > 0) {
			await tx
				.update(representationAllowances)
				.set({ endDate })
				.where(inArray(
					representationAllowances.id,
					running.map((item) => item.id),
				))
		}
	}

	const [ result ] = await tx
		.insert(representationAllowances)
		.values(data)
		.returning({ id: representationAllowances.id })

	if(!result) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Aufwandsentschädigung konnte nicht erstellt werden',
		})
	}

	for(const recipient of data.recipients) {
		await tx.insert(representationAllowanceRecipients).values({
			...recipient,
			representationAllowance: result.id,
		})
	}
}

export async function applyProcessMutations(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
) {
	const processMetadata = await tx.query.workflowProcesses.findFirst({
		where: eq(workflowProcesses.id, processId),
		columns: {
			id: true,
			initiatorType: true,
			initiatorPerson: true,
			initiatorOrganizationItem: true,
		},
	})

	const mutations = await tx.query.workflowProcessMutations.findMany({
		where: eq(workflowProcessMutations.process, processId),
		with: {
			mutation: true,
		},
		columns: {
			dataId: true,
			data: true,
		},
	})

	for(const mutation of mutations) {
		const handler = {
			candidates: {
				create: createCandidate,
				update: () => { /**/ },
				delete: () => { /**/ },
			},
			budgetPlans: {
				create: createBudgetPlan,
				update: () => { /**/ },
				delete: () => { /**/ },
			},
			expenseAuthorizations: {
				create: createExpenseAuthorization,
				update: () => { /**/ },
				delete: () => { /**/ },
			},
			longtermContracts: {
				create: createLongtermContract,
				update: () => { /**/ },
				delete: () => { /**/ },
			},
			representationAllowances: {
				create: createRepresentationAllowance,
				update: () => { /**/ },
				delete: () => { /**/ },
			},
		}[mutation.mutation.table]?.[mutation.mutation.action]

		if(!handler) {
			continue
		}

		// @ts-expect-error | Data is untyped in database
		await handler(tx, mutation.dataId, mutation.data, {
			...processMetadata,
			mutationId: mutation.mutation.id,
			meta: mutation.mutation.meta,
		})
	}
}
