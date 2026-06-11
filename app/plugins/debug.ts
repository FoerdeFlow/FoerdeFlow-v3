export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.config.errorHandler = (
		err,
		instance,
		info
	) => {
		console.error('Vue error:', err)
		console.error(info)
	}
})