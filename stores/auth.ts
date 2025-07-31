import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
	interface UserInfo {
		id: string
		email: string
		firstName: string
		lastName: string
		callName?: string
		pronouns?: string
		permissions: string[]
	}
	const userInfo = ref<UserInfo | null>(null)

	const loggedIn = computed(() => userInfo.value !== null)

	async function initialize() {
		const route = useRoute()
		const router = useRouter()
		if(route?.query?.returnTo) {
			router.replace(route.query.returnTo as string)
		}

		try {
			userInfo.value = await $fetch<UserInfo>('/api/auth/userInfo')
		} catch(e) { /**/ }
	}

	function hasPermission(permission: string): boolean {
		return userInfo.value?.permissions.includes(permission) || false
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
		initialize,
		hasPermission,
		login,
		logout,
		loggedIn,
		userInfo: readonly(userInfo),
	}
})