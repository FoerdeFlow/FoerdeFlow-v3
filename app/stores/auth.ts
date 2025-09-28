import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
	interface UserInfo {
		person?: {
			id: string
			email: string
			firstName: string
			lastName: string
			callName?: string
			pronouns?: string
		}
		memberships?: unknown[]
		roles: unknown[]
		permissions: string[]
	}

	const { data: userInfo } = useFetch<UserInfo>('/api/auth/userInfo', {
		default: () => ({
			roles: [],
			permissions: [],
		} as UserInfo),
	})

	const loggedIn = computed(() => Boolean(userInfo.value.person))

	function hasPermission(permission: string): Ref<boolean> {
		return computed(() => userInfo.value.permissions.includes(permission))
	}

	function login() {
		const route = useRoute()
		const form = document.createElement('form')
		form.method = 'POST'
		form.action = `/api/auth/oidc/login?returnTo=${route.fullPath}`
		form.style.display = 'none'
		document.body.appendChild(form)
		form.submit()
	}

	function logout() {
		const route = useRoute()
		const form = document.createElement('form')
		form.method = 'POST'
		form.action = `/api/auth/logout?returnTo=${route.fullPath}`
		form.style.display = 'none'
		document.body.appendChild(form)
		form.submit()
	}

	return {
		hasPermission,
		login,
		logout,
		loggedIn,
		userInfo: readonly(userInfo),
	}
})
