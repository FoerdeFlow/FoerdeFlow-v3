export async function executeProcessJob(
	jobLabel: string,
	tx: ReturnType<typeof useDatabase>,
	processId: string,
) {
	const [ job, ...args ] = jobLabel.split('-')
	switch(job) {
		case 'createDocument':
			const target = args[0]
			await jobCreateDocument(tx, processId, target ?? '')
			break
		case 'notifyCandidate':
			await jobNotifyCandidate(tx, processId)
			break
		default:
			throw createError({
				statusCode: 400,
				statusMessage: 'Unbekannter Job',
				data: {
					job,
				},
			})
	}
}
