import type { KernAlert } from '#components'

export const useAlertStore = defineStore('alert', () => {
	type AlertProps = InstanceType<typeof KernAlert>['$props']
	const alerts = ref<AlertProps[]>([])

	function showAlert(props: AlertProps) {
		alerts.value.push(props)
		if(props.type !== 'danger') {
			setTimeout(() => {
				alerts.value.shift()
			}, 5000)
		}
	}

	return {
		alerts,
		showAlert,
	}
})
