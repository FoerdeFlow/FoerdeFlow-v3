import { defineStore } from 'pinia'

import type { UserInfo } from '#shared/types'

/**
 * Sends a POST to the endpoint through a hidden form so that the browser treats
 * the response as a full page load. After a change of identity every loaded
 * payload is stale, this store included.
 *
 * @param action - The address the form submits to
 */
function submitForm(action: string) {
	const form = document.createElement('form')
	form.method = 'POST'
	form.action = action
	form.style.display = 'none'
	document.body.appendChild(form)
	form.submit()
}

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

	const impersonating = computed(() => Boolean(userInfo.value.impersonator))

	const isAdmin = computed(() => userInfo.value.roles.some((role) => role.isAdmin))

	/*
	 * Während einer Impersonation stammen die Rollen von der angenommenen
	 * Identität. Ist diese selbst Administrator, wäre `isAdmin` wahr, ohne dass
	 * eine weitere Impersonation zulässig ist.
	 */
	const canImpersonate = computed(() => loggedIn.value && isAdmin.value && !impersonating.value)

	function login() {
		const route = useRoute()
		submitForm(`/api/auth/oidc/login?returnTo=${route.fullPath}`)
	}

	function logout() {
		const route = useRoute()
		submitForm(`/api/auth/logout?returnTo=${route.fullPath}`)
	}

	function impersonate(person: string) {
		submitForm(`/api/auth/impersonate?person=${person}`)
	}

	function stopImpersonation() {
		submitForm('/api/auth/impersonate/stop')
	}

	function requireLogin() {
		onMounted(() => {
			if(!loggedIn.value) {
				login()
			}
		})
	}

	return {
		canImpersonate,
		displayName,
		hasPermission,
		impersonate,
		impersonating,
		isAdmin,
		loggedIn,
		login,
		logout,
		requireLogin,
		stopImpersonation,
		userInfo: readonly(userInfo),
	}
})
