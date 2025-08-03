import { Agent, setGlobalDispatcher } from 'undici'

export default defineNitroPlugin(async (nitroApp) => {
	const dispatcher = new Agent({
		connect: {
			rejectUnauthorized: false,
		},
	})
	setGlobalDispatcher(dispatcher)
})