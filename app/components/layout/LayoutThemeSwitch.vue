<script setup lang="ts">
import type { ThemePreference } from '~/composables/useTheme'

const { preference } = useTheme()

const options: { value: ThemePreference, icon: string, label: string }[] = [
	{ value: 'system', icon: 'brightness-medium', label: 'Systemeinstellung' },
	{ value: 'light', icon: 'light-mode', label: 'Hell' },
	{ value: 'dark', icon: 'dark-mode', label: 'Dunkel' },
]
</script>

<template lang="pug">
.kern-btn-wrapper.ff3-theme-switch(
	role="group"
	aria-label="Farbschema"
)
	button.kern-btn.kern-btn--x-small(
		v-for="option of options"
		:key="option.value"
		type="button"
		:class="preference === option.value ? 'kern-btn--primary' : 'kern-btn--tertiary'"
		:aria-pressed="preference === option.value"
		:title="`Farbschema: ${option.label}`"
		@click="preference = option.value"
	)
		span.kern-icon(
			:class="`kern-icon--${option.icon}`"
			aria-hidden="true"
		)
		span.kern-sr-only Farbschema: {{ option.label }}
</template>

<style scoped>
/*
 * KERN setzt den Abstand einer Gruppe aus `kern-btn--x-small` mit `kern-sr-only`
 * bereits auf 0, sodass die drei Schaltflächen als zusammenhängende Gruppe
 * erscheinen. Der Rahmen grenzt die Gruppe vom Hintergrund ab.
 */
.ff3-theme-switch {
	flex-wrap: nowrap;
	border: var(--kern-metric-border-width-light) solid var(--kern-color-decorative-border-contextual);
	border-radius: var(--kern-metric-border-radius-default);
}
</style>
