import { Agent, setGlobalDispatcher } from 'undici'

export default defineNitroPlugin(() => {
	if(import.meta.dev) {
		const dispatcher = new Agent({
			connect: {
				rejectUnauthorized: false,
			},
		})
		setGlobalDispatcher(dispatcher)
	}
})
