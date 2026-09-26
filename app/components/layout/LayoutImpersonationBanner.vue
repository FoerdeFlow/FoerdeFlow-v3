<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template lang="pug">
.ff3-impersonation(
	v-if="authStore.impersonating"
	role="region"
	aria-label="Angenommene Identität"
)
	.kern-container
		.ff3-impersonation__content
			span.kern-icon.kern-icon--small.kern-icon--danger(aria-hidden="true")
			p.ff3-impersonation__text
				| Sie sind als #[b {{ authStore.displayName }}] angemeldet und sehen die Anwendung
				|
				| mit deren Berechtigungen. Alle Änderungen werden dieser Person zugerechnet,
				|
				| nicht {{ authStore.userInfo.impersonator?.displayName }}.
			button.kern-btn.kern-btn--x-small.kern-btn--primary(
				type="button"
				@click="authStore.stopImpersonation()"
			)
				span.kern-icon.kern-icon--logout(aria-hidden="true")
				span.kern-label Identität verlassen
</template>

<style scoped>
/*
 * Fläche und Rahmen nutzen dasselbe Tokenpaar wie `kern-alert--danger`, das die
 * Textfarbe unverändert lässt. Damit stimmen Hintergrund und Text in beiden
 * Farbschemata zusammen, und das `kern-icon--danger` übernimmt über
 * `--kern-color-layout-text-default-contextual` automatisch die Textfarbe.
 */
.ff3-impersonation {
	border-bottom: var(--kern-metric-border-width-bold) solid var(--kern-color-feedback-danger-contextual);
	background-color: var(--kern-color-feedback-danger-background-contextual);
}

.ff3-impersonation__content {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--kern-metric-space-small);
	padding: var(--kern-metric-space-2x-small) var(--kern-metric-space-none);
}

.ff3-impersonation__text {
	flex: 1;
	margin: 0;
	color: var(--kern-color-layout-text-default-contextual);
	font-size: var(--kern-typography-font-size-small-static);
	line-height: var(--kern-typography-line-height-medium-static);
}
</style>
