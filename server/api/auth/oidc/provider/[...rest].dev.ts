import * as oidc from 'oidc-provider'

const provider = new oidc.Provider('https://localhost:3000/api/auth/oidc/provider', {
	clients: [
		{
			client_id: 'dev',
			client_secret: 'dev',
			redirect_uris: [ 'https://localhost:3000/api/auth/oidc/callback' ],
		},
	],
})
provider.proxy = true

export default defineEventHandler(async (event) => {
	event.node.req.originalUrl = event.node.req.url
	event.node.req.url = event.node.req.url?.replace('/api/auth/oidc/provider', '')
	await provider.callback()(event.node.req, event.node.res)
})
