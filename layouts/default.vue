<script setup lang="ts">
const authStore = useAuthStore()
const alertStore = useAlertStore()

const displayName = computed(() => authStore.userInfo
	? `${authStore.userInfo.callName ?? authStore.userInfo.firstName} ${authStore.userInfo.lastName}`
	: 'Gast')
</script>

<template lang="pug">
.kern-kopfzeile
	.kern-container
		.kern-kopfzeile__content
			span.kern-kopfzeile__label Studierendenparlament der HAW Kiel
header(:class="$style.header")
	template(v-if="authStore.loggedIn")
		.flex.flex-col.justify-between.gap-2.mb-4(class="md:flex-row")
			p.flex-1.kern-text Willkommen, #[b {{ displayName }}]!
			.flex.flex-row.gap-2
				button.kern-btn.kern-btn--primary(
					type="button"
					@click="$router.push('/')"
				)
					span.kern-icon.kern-icon--home(aria-hidden="true")
					span.kern-sr-only Startseite
				button.flex-1.kern-btn.kern-btn--primary(
					type="button"
					@click="authStore.logout()"
				)
					span.kern-label Abmelden
	template(v-else)
		.flex.flex-row.justify-between.gap-2.mb-4
			button.kern-btn.kern-btn--primary(
				type="button"
				@click="$router.push('/')"
			)
				span.kern-icon.kern-icon--home(aria-hidden="true")
				span.kern-sr-only Startseite
			button.flex-1.kern-btn.kern-btn--primary(
				type="button"
				@click="authStore.login()"
			)
				span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
				span.kern-label Anmelden
hr.kern-divider(aria-hidden="true")
main(:class="$style.main")
	KernAlert(
		v-for="(alert, idx) of alertStore.alerts"
		:key="idx"
		:type="alert.type"
		:title="alert.title"
		:text="alert.text"
		@close="alertStore.alerts.splice(idx, 1)"
	)
	slot
</template>

<style module>
.header {
	margin: 1em;
	max-width: 80em;
}

.main {
	margin: 2em;
	max-width: 80em;
}

@media (min-width: 90em) {
	.header {
		margin: 1em auto;
		max-width: 80em;
	}

	.main {
		margin: 4em auto;
		max-width: 80em;
	}
}
</style>
