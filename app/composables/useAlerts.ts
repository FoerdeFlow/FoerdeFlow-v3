import type { KernAlert } from '#components'

export type AlertProps = InstanceType<typeof KernAlert>['$props']

export interface Alert {
	id: number
	props: AlertProps
}

/**
 * Wartezeit, nach der sich eine unkritische Meldung selbst schließt.
 */
const DISMISS_DELAY = 5000

/**
 * Obergrenze gleichzeitig sichtbarer Meldungen. Mehr davon verdecken den
 * Inhalt, statt über ihn zu informieren.
 */
const MAX_ALERTS = 3

/**
 * Verwaltet eine Liste von Meldungen samt ihrer Lebensdauer.
 *
 * Meldungen vom Typ `danger` laufen bewusst nicht ab: Eine Fehlermeldung, die
 * sich nach wenigen Sekunden selbst entfernt, setzt Nutzende unter Zeitdruck
 * (WCAG 2.2.1). Sie verschwinden nur durch Schließen oder dadurch, dass der
 * auslösende Kontext verlassen wird. Alle übrigen Typen blenden sich nach
 * {@link DISMISS_DELAY} aus, solange sie nicht per {@link pauseAlert}
 * angehalten werden.
 */
export function useAlerts() {
	const alerts = ref<Alert[]>([])
	const timers = new Map<number, ReturnType<typeof setTimeout>>()

	let nextId = 0

	function stopTimer(id: number) {
		const timer = timers.get(id)
		if(timer === undefined) return
		clearTimeout(timer)
		timers.delete(id)
	}

	function dismissAlert(id: number) {
		stopTimer(id)
		alerts.value = alerts.value.filter((alert) => alert.id !== id)
	}

	function startTimer(id: number) {
		stopTimer(id)
		timers.set(id, setTimeout(() => {
			dismissAlert(id)
		}, DISMISS_DELAY))
	}

	function clearAlerts() {
		for(const timer of timers.values()) clearTimeout(timer)
		timers.clear()
		alerts.value = []
	}

	function isSameAlert(a: AlertProps, b: AlertProps) {
		return a.type === b.type &&
			a.title === b.title &&
			a.text === b.text &&
			a.items?.join('\n') === b.items?.join('\n')
	}

	function showAlert(props: AlertProps) {
		// Wiederholte Fehlversuche sollen keine Wand aus identischen Meldungen
		// stapeln, sondern die bestehende Meldung auffrischen.
		const existing = alerts.value.find((alert) => isSameAlert(alert.props, props))
		if(existing) {
			if(props.type !== 'danger') startTimer(existing.id)
			return existing.id
		}

		const id = nextId++
		alerts.value.push({ id, props })
		if(props.type !== 'danger') startTimer(id)

		// Ältere Meldungen weichen den neuen, da diese sich auf die zuletzt
		// ausgelöste Aktion beziehen.
		while(alerts.value.length > MAX_ALERTS) {
			const oldest = alerts.value[0]
			if(!oldest) break
			dismissAlert(oldest.id)
		}

		return id
	}

	/**
	 * Hält den Ablauf einer Meldung an, solange sie den Zeiger oder den Fokus
	 * hält, damit sie beim Lesen nicht unter den Händen verschwindet.
	 */
	function pauseAlert(id: number) {
		stopTimer(id)
	}

	function resumeAlert(id: number) {
		const alert = alerts.value.find((entry) => entry.id === id)
		if(!alert || alert.props.type === 'danger') return
		startTimer(id)
	}

	onScopeDispose(() => {
		for(const timer of timers.values()) clearTimeout(timer)
		timers.clear()
	})

	return {
		alerts,
		clearAlerts,
		dismissAlert,
		pauseAlert,
		resumeAlert,
		showAlert,
	}
}
