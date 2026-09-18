<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()

const environment = computed(() => runtimeConfig.public.environment)
</script>

<template lang="pug">
.ff3-env(
	v-if="environment !== 'production'"
	:class="`ff3-env--${environment}`"
)
	.kern-container
		p.ff3-env__content
			span.kern-icon.kern-icon--small.kern-icon--warning(aria-hidden="true")
			span
				| Sie befinden sich in der #[b {{ $t(`environment.${environment}`) }}].
				|
				| Diese Umgebung dient nur zu Testzwecken und könnte jederzeit zurückgesetzt werden.
</template>

<style scoped>
/*
 * Die Umgebungsfarben sind Markenfarben und in beiden Farbschemata identisch.
 * Deshalb wird die kontextuelle Textfarbe hier fest auf den dunklen KERN-Wert
 * gesetzt: `#131525` erreicht auf allen vier Hintergründen mindestens 5,7:1
 * und erfüllt damit WCAG AA. Über den kontextuellen Token übernimmt auch das
 * `kern-icon` (Maske mit `background-color`) automatisch diese Farbe.
 */
.ff3-env {
	--kern-color-layout-text-default-contextual: var(--kern-color-neutral-950);

	background-color: var(--ff3-env-color);
}

.ff3-env--development { --ff3-env-color: #e86a5b; }
.ff3-env--stage { --ff3-env-color: #009dc9; }
.ff3-env--test { --ff3-env-color: #d07e00; }
.ff3-env--qa { --ff3-env-color: #00a481; }

.ff3-env__content {
	display: flex;
	align-items: center;
	gap: var(--kern-metric-space-small);
	margin: 0;
	padding: var(--kern-metric-space-2x-small) var(--kern-metric-space-none);
	color: var(--kern-color-layout-text-default-contextual);
	font-size: var(--kern-typography-font-size-small-static);
	line-height: var(--kern-typography-line-height-medium-static);
}
</style>
