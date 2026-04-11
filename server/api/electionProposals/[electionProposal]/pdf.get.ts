import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		electionProposal: idSchema,
	}).parseAsync(data))

	const proposal = await $fetch(`/api/electionProposals/${params.electionProposal}`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
	})

	const [ candidate ] = await $fetch(`/api/candidates?electionProposal=${params.electionProposal}`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
	})

	const photoResponse = await $fetch(`/api/persons/${candidate.candidate.id}/photo`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
		responseType: 'arrayBuffer',
	})
	const photo = Buffer.from(photoResponse as ArrayBuffer)

	const electionCommittee = await $fetch(`/api/electionCommittees/${proposal.electionCommittee}`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
	})

	const election = await $fetch(`/api/elections/${electionCommittee.election}`, {
		headers: {
			cookie: getHeader(event, 'cookie') ?? '',
			'x-foerdeflow-api-key': getHeader(event, 'x-foerdeflow-api-key') ?? '',
		},
	})

	const doc = await pdfEncodeElectionProposal({
		id: params.electionProposal,
		election: election.title,
		submitter: formatPerson(proposal.submitter),
		committee: formatOrganizationItem(electionCommittee.committee),
		photo,
		candidate: formatPerson(candidate.candidate),
		postalAddress: candidate.candidate.postalAddress || '',
		email: candidate.candidate.email,
		matriculationNumber: candidate.candidate.matriculationNumber?.toString() || '',
		council: formatCouncil(candidate.candidate.course?.council || null),
		course: formatCourse(candidate.candidate.course),
		applicationLetter: candidate.applicationLetter || '',
	})

	const blob = doc.output('blob')
	setResponseHeader(
		event,
		'Content-Disposition',
		`inline; filename="Wahlvorschlag_${params.electionProposal}.pdf"`,
	)
	return blob
})
