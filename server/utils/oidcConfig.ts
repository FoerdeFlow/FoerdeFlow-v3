import * as client from 'openid-client'

export async function getOidcConfig() {
	const runtimeConfig = useRuntimeConfig()
	const oidcConfig = runtimeConfig.oidcProvider
	return await client.discovery(
		new URL(oidcConfig.server),
		oidcConfig.clientId,
		{
			client_secret: oidcConfig.clientSecret,
		},
		client.ClientSecretPost(),
		{
			execute: [
				...(import.meta.dev ? [ client.allowInsecureRequests ] : []),
			],
		}
	)
}