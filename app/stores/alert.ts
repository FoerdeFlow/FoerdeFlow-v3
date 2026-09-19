export const useAlertStore = defineStore('alert', () => {
	const { alerts, clearAlerts, dismissAlert, pauseAlert, resumeAlert, showAlert } = useAlerts()

	// Eine Meldung bezieht sich auf die Aktion, die sie ausgelöst hat. Nach
	// einem Seitenwechsel fehlt dieser Bezug, deshalb räumt die Navigation auch
	// die Fehlermeldungen ab, die von sich aus nicht ablaufen.
	useRouter().afterEach(() => {
		clearAlerts()
	})

	return {
		alerts,
		clearAlerts,
		dismissAlert,
		pauseAlert,
		resumeAlert,
		showAlert,
	}
})
