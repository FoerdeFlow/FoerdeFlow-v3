<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute('organizationItems-organizationItem-sessions-session-attendances')

const { data } = useFetch(`/api/sessions/${route.params.session}/attendances`)
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'organizationItems-organizationItem-sessions-session', params: { organizationItem: route.params.organizationItem, session: route.params.session } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Sitzung
| Anwesenheitsliste
pre {{ data }}
</template>
