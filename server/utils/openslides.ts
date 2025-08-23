import { OpenslidesClient } from 'openslides-client'

export function useOpenslides() {
	const runtimeConfig = useRuntimeConfig()
	return new OpenslidesClient({
		serverURL: runtimeConfig.openslides.server,
		username: runtimeConfig.openslides.username,
		password: runtimeConfig.openslides.password,
	})
}
