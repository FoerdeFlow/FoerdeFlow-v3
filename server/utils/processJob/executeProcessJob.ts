export async function executeProcessJob(
	job: string,
	tx: ReturnType<typeof useDatabase>,
	processId: string,
) {
	switch (job) {
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