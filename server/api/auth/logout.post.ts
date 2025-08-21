import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
	const session = await useSession(event, { password: runtimeConfig.sessionSecret })
	const { returnTo } = await getValidatedQuery(event, z.object({
		returnTo: z.string().optional(),
	}).strict().parseAsync)

	const oidcConfig = await getOidcConfig()

	await session.clear()
	await sendRedirect(event, returnTo || '/', 307)
})
