<script setup lang="ts">
const id = useId()
const model = defineModel()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Mitgliedschaftsart
	MembershipTypeSelect(
		:id="id"
		v-model="model"
	)
</template>