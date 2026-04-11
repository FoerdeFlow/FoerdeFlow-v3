import { copyFile } from 'node:fs/promises'
import { eq, type InferInsertModel } from 'drizzle-orm'
import type z from 'zod'

async function createCandidate(
	tx: ReturnType<typeof useDatabase>,
	dataId: string | null,
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
) {
	const [ result ] = await tx
		.insert(expenseAuthorizations)
		.values(data)
		.returning({ id: expenseAuthorizations.id })

	for(const item of data.items) {
		await tx.insert(expenseAuthorizationItems).values({
			...item,
			expenseAuthorization: result.id,
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
			expenseAuthorizations: {
				create: createExpenseAuthorization,
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
		})
	}
}
