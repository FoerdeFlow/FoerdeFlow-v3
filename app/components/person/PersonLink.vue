<script setup lang="ts">
const props = defineProps<{
	person: {
		id: string
		firstName: string
		lastName: string
		callName?: string | null
		pronouns?: string | null
	} | null
	style?: 'short' | 'long'
}>()

const authStore = useAuthStore()

/*
 * Ohne die Berechtigung bleibt der Name stehen, denn er steht an dieser Stelle
 * ohnehin schon — nur der Weg zur Detailseite entfällt, weil sie sich gar nicht
 * erst laden ließe.
 */
const linked = authStore.hasPermission('persons.read')
</script>

<template lang="pug">
NuxtLink.kern-link(
	v-if="props.person && linked"
	:to="{ name: 'person-person', params: { person: props.person.id } }"
) {{ formatPerson(props.person, props.style) }}
template(v-else)
	| {{ formatPerson(props.person, props.style) }}
</template>
