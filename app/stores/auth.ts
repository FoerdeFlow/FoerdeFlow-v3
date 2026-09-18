import { defineStore } from 'pinia'

import type { UserInfo } from '#shared/types'

export const useAuthStore = defineStore('auth', () => {
	const { data: userInfo } = useFetch<UserInfo>('/api/auth/userInfo', {
		default: () => ({
			roles: [],
			permissions: [],
		}),
	})

	const loggedIn = computed(() => Boolean(userInfo.value.person))

	const displayName = computed(() => {
		const person = userInfo.value.person
		if(!person) return 'Gast'
		return `${person.callName ?? person.firstName} ${person.lastName}`
	})

	function hasPermission(
		permission: string,
		scope: {
			organizationItem?: string
		} = {},
	): Ref<boolean> {
		return computed(() =>
			userInfo.value.permissions.some((item) =>
				item.permission === permission &&
				(
					item.organizationItem === false ||
					item.organizationItem === null ||
					item.organizationItem === scope.organizationItem
				),
			),
		)
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

	function requireLogin() {
		onMounted(() => {
			if(!loggedIn.value) {
				login()
			}
		})
	}

	return {
		displayName,
		hasPermission,
		loggedIn,
		login,
		logout,
		requireLogin,
		userInfo: readonly(userInfo),
	}
})
