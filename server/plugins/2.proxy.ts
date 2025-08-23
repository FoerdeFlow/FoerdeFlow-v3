import { Agent, setGlobalDispatcher } from 'undici'

export default defineNitroPlugin(() => {
	const dispatcher = new Agent({
		connect: {
			rejectUnauthorized: false,
		},
	})
	setGlobalDispatcher(dispatcher)
})
