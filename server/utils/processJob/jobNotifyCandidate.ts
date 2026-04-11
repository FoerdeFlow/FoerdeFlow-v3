import { readFile } from 'node:fs/promises'
import { eq } from 'drizzle-orm'

export async function jobNotifyCandidate(
	tx: ReturnType<typeof useDatabase>,
	processId: string,
) {
	const process = await tx.query.workflowProcesses.findFirst({
		where: eq(workflowProcesses.id, processId),
		with: {
			initiatorPerson: true,
		},
		columns: {},
	})
	if(!process) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Prozess nicht gefunden',
			data: {
				processId,
			},
		})
	}

	const mutation = await tx.query.workflowProcessMutations.findFirst({
		where: (tbl, { and, eq, exists }) => and(
			eq(tbl.process, processId),
			exists(
				tx.select()
					.from(workflowMutations)
					.where(and(
						eq(workflowMutations.id, tbl.mutation),
						eq(workflowMutations.table, 'candidates'),
					)),
			),
		),
		columns: {
			mutation: true,
			data: true,
		},
	})
	if(!mutation) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Candidate mutation not found for process',
			data: {
				processId,
			},
		})
	}

	const data = await encodeProcessData(tx, 'candidates', mutation.data as any)

	let photo = null
	try {
		photo = await readFile(`./data/${processId}_${mutation.mutation}_photo`)
	} catch(error) {
		// Ignore error if photo not found
	}

	const document = await pdfEncodeElectionProposal({
		election: data.electionCommittee?.election.title ?? '',
		submitter: formatPerson(process.initiatorPerson),
		committee: formatOrganizationItem(data.electionCommittee?.committee || null),
		photo,
		candidate: formatPerson(data.candidate ?? null),
		postalAddress: data.postalAddress,
		email: data.candidate?.email ?? '',
		matriculationNumber: data.matriculationNumber?.toString() ?? '',
		council: formatCouncil(data.course?.council ?? null),
		course: formatCourse(data.course ?? null),
		applicationLetter: data.applicationLetter ?? '',
	})
	const documentBlob = document.output('arraybuffer')

	await sendMail({
		to: data.candidate?.email ?? '',
		replyTo: data.electionCommittee?.election.email,
		bcc: data.electionCommittee?.election.email,
		subject: 'Deine Kandidatur - Unterschrift benötigt',
		text: `Liebe*r ${formatPerson(data.candidate ?? null)},\n\n` +
			'anbei findest du deine Kandidatur als PDF-Dokument.\n\n' +
			'Aus rechtlichen Gründen benötigen wir deine Unterschrift auf dem Wahlvorschlag. ' +
			'Bitte unterschreibe das Dokument und sende es an den Wahlausschuss, indem du auf diese E-Mail antwortest.\n\n' +
			'Mit freundlichen Grüßen\nDer Wahlausschuss',
		attachments: [
			{
				filename: 'Wahlvorschlag_zur_Unterschrift.pdf',
				content: Buffer.from(documentBlob),
			},
		],
	})
}
