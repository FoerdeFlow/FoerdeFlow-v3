<script setup lang="ts">
import type { Session } from '~/types'

const id = useId()

const props = defineProps<{
	organizationItem: string
}>()

const model = defineModel<Session>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Sitzung
	SessionSelect(
		:id="id"
		v-model="model"
		:organization-item="props.organizationItem"
	)
</template>
