import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
	const session = await useSession(event, { password: runtimeConfig.sessionSecret })
	const { returnTo } = await getValidatedQuery(event, async (data) => await z.object({
		returnTo: z.string().optional(),
	}).strict().parseAsync(data))

	await session.clear()
	await sendRedirect(event, returnTo ?? '/', 307)
})
