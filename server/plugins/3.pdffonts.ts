export default defineNitroPlugin(() => {
	import('../fonts/OpenSans-normal.js').catch(console.error)
	import('../fonts/OpenSans-bold.js').catch(console.error)
	import('../fonts/OpenSans-italic.js').catch(console.error)
	import('../fonts/OpenSans-bolditalic.js').catch(console.error)
})
