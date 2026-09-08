import type z from 'zod'

import { and, eq, gt, inArray, type InferInsertModel, isNull, or } from 'drizzle-orm'
import { access, copyFile } from 'node:fs/promises'

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

	const [ candidate ] = await tx.insert(candidates).values({
		electionProposal: result.id,
		candidate: data.candidate,
		applicationLetter: data.applicationLetter,
	}).returning({ id: candidates.id })

	await copyFile(
		`./data/${processMetadata.id}_${processMetadata.mutationId}_photo`,
		`./data/${data.candidate}`,
	)

	return candidate?.id ?? null
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

	return result.id
}

/**
 * Resolves a reference to an item of a budget plan that was still being applied
 * for when the reference was made.
 *
 * The plan of the referenced process exists by now, because a process is only
 * completed once every process it depends on is. Its rows are found through the
 * `dataId` its mutation was given when it was applied.
 *
 * @param tx - The transaction to resolve in
 * @param reference - The referenced process and the ordinal within its plan
 * @returns The id of the budget plan item the reference points at
 */
async function resolvePendingBudgetPlanItem(
	tx: ReturnType<typeof useDatabase>,
	reference: { process: string, ord: number },
) {
	const mutations = await tx.query.workflowProcessMutations.findMany({
		where: eq(workflowProcessMutations.process, reference.process),
		with: {
			mutation: true,
		},
		columns: {
			dataId: true,
		},
	})
	const plan = mutations.find((item) =>
		item.mutation.table === 'budgetPlans' && item.mutation.action === 'create')

	if(!plan?.dataId) {
		throw createError({
			statusCode: 409,
			message: 'Der beantragte Haushaltsplan, aus dem die Ausgabeermächtigung bezahlt ' +
				'werden soll, wurde nicht angelegt',
			data: { process: reference.process },
		})
	}

	const item = await tx.query.budgetPlanItems.findFirst({
		where: and(
			eq(budgetPlanItems.plan, plan.dataId),
			eq(budgetPlanItems.ord, reference.ord),
		),
		columns: {
			id: true,
		},
	})
	if(!item) {
		throw createError({
			statusCode: 409,
			message: 'Der Haushaltstitel, aus dem die Ausgabeermächtigung bezahlt werden ' +
				'soll, kommt im genehmigten Haushaltsplan nicht vor',
			data: { process: reference.process, ord: reference.ord },
		})
	}

	return item.id
}

async function createExpenseAuthorization(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: Omit<
		InferInsertModel<typeof expenseAuthorizations>,
		'id'
	> & {
		pendingBudgetPlanItem?: { process: string, ord: number } | null
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

	const { pendingBudgetPlanItem, ...values } = data
	const budgetPlanItem = pendingBudgetPlanItem
		? await resolvePendingBudgetPlanItem(tx, pendingBudgetPlanItem)
		: values.budgetPlanItem ?? null

	const [ result ] = await tx
		.insert(expenseAuthorizations)
		.values({ ...values, budgetPlanItem, type })
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

	return result.id
}

/**
 * Writes a payment order that was applied for.
 *
 * Where the money comes from and who receives it are part of the application
 * itself, so both are taken from the input. A workflow that wants to fix either
 * of them does so with a preset on the field.
 *
 * @param tx - The transaction to write in
 * @param _dataId - Unused, a payment order is always created anew
 * @param data - The data of the mutation
 * @returns The id of the payment order that was created
 */
async function createPaymentOrder(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: Omit<InferInsertModel<typeof paymentOrders>, 'id'>,
) {
	const [ result ] = await tx
		.insert(paymentOrders)
		.values(data)
		.returning({ id: paymentOrders.id })

	if(!result) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Zahlungsanweisung konnte nicht erstellt werden',
		})
	}

	return result.id
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

	return result.id
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

	return result.id
}

/**
 * Writes the data a person adjusted about themselves.
 *
 * The whole set of fields is written, not only the ones that were changed. The
 * form starts out with the values the person has at the moment, so everything
 * that was left untouched is written back unchanged.
 *
 * @param tx - The transaction to write in
 * @param _dataId - Unused, the person exists before the process
 * @param data - The data of the mutation, with the person it applies to
 * @returns The id of the person whose data was written
 */
async function updatePerson(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: z.infer<typeof processSchemas.persons.update> & { person: string },
) {
	await tx.update(persons).set({
		callName: data.callName,
		pronouns: data.pronouns,
		gender: data.gender,
		matriculationNumber: data.matriculationNumber,
		course: data.course,
		postalAddress: data.postalAddress,
	}).where(eq(persons.id, data.person))

	return data.person
}

/**
 * Writes the bank details a person handed in.
 *
 * The IBAN was already checked against its check digits and stripped of its
 * spaces when the process was created, so it is stored as it comes.
 *
 * @param tx - The transaction to write in
 * @param _dataId - Unused, the person exists before the process
 * @param data - The data of the mutation, with the person it applies to
 * @returns The id of the person whose IBAN was written
 */
async function updatePersonIban(
	tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: z.infer<typeof processSchemas.personIbans.update> & { person: string },
) {
	await tx.update(persons).set({
		iban: data.iban,
	}).where(eq(persons.id, data.person))

	return data.person
}

/**
 * Puts the photo a person handed in during the process in place of their
 * current one.
 *
 * Handing in no photo is allowed and means that the current one stays, so a
 * mutation without an attachment does nothing.
 *
 * @param _tx - Unused, the photo is not stored in the database
 * @param _dataId - Unused, the person exists before the process
 * @param data - The data of the mutation, with the person it applies to
 * @param processMetadata - The process and the mutation the photo came with
 * @returns The id of the person the mutation applies to
 */
async function updatePersonPhoto(
	_tx: ReturnType<typeof useDatabase>,
	_dataId: string | null,
	data: { person: string },
	processMetadata: {
		id: string
		mutationId: string
	},
) {
	const source = `./data/${processMetadata.id}_${processMetadata.mutationId}_photo`
	const handedIn = await access(source).then(() => true).catch(() => false)

	if(handedIn) {
		await copyFile(source, `./data/${data.person}`)
	}

	return data.person
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
			id: true,
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
			paymentOrders: {
				create: createPaymentOrder,
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
			persons: {
				create: () => { /**/ },
				update: updatePerson,
				delete: () => { /**/ },
			},
			personIbans: {
				create: () => { /**/ },
				update: updatePersonIban,
				delete: () => { /**/ },
			},
			personPhotos: {
				create: () => { /**/ },
				update: updatePersonPhoto,
				delete: () => { /**/ },
			},
		}[mutation.mutation.table]?.[mutation.mutation.action]

		if(!handler) {
			continue
		}

		// @ts-expect-error | Data is untyped in database
		const dataId = await handler(tx, mutation.dataId, mutation.data, {
			...processMetadata,
			mutationId: mutation.mutation.id,
			meta: mutation.mutation.meta,
		})

		// From now on the mutation refers to the row it created. That is how a
		// process finds the data of an application it depends on, once that
		// application has been approved.
		if(typeof dataId === 'string') {
			await tx
				.update(workflowProcessMutations)
				.set({ dataId })
				.where(eq(workflowProcessMutations.id, mutation.id))
		}
	}
}
