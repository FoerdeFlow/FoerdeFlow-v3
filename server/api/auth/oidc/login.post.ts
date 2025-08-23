import * as client from 'openid-client'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
	const session = await useSession(event, { password: runtimeConfig.sessionSecret })
	const { returnTo } = await getValidatedQuery(event, async (data) => await z.object({
		returnTo: z.string().optional(),
	}).strict().parseAsync(data))

	const oidcConfig = await getOidcConfig()

	const codeVerifier = client.randomPKCECodeVerifier()
	const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
	const state = client.randomState()

	const baseURL = runtimeConfig.app.baseURL === '/' ? '' : runtimeConfig.app.baseURL
	const redirectUri = client.buildAuthorizationUrl(oidcConfig, {
		redirect_uri: `${runtimeConfig.externalURL}${baseURL}/api/auth/oidc/callback`,
		scope: 'openid',
		state,
		code_challenge_method: 'S256',
		code_challenge: codeChallenge,
	})

	await session.update({ codeVerifier, state, returnTo })
	await sendRedirect(event, redirectUri.toString(), 303)
})
