import * as oidc from 'oidc-provider'

const provider = new oidc.Provider('http://localhost:3000/api/auth/oidc/provider', {
	clients: [
		{
			client_id: 'dev',
			client_secret: 'dev',
			redirect_uris: [ 'http://localhost:3000/api/auth/oidc/callback' ],
		},
	],
})

export default defineEventHandler(async event => {
	event.node.req.originalUrl = event.node.req.url;
	event.node.req.url = event.node.req.url?.replace('/api/auth/oidc/provider', '');
	await provider.callback()(event.node.req, event.node.res)
})