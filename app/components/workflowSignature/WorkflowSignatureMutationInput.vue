<script setup lang="ts">
const id = useId()

const props = defineProps<{
	workflow: string
}>()

const model = defineModel<string | null>({
	required: true,
})

const { data } = useFetch('/api/workflowMutations', {
	query: {
		workflow: props.workflow,
	},
})

const mutations = computed(() =>
	(data.value ?? []).filter((mutation) => isPdfSupportedMutationTable(mutation.table)),
)
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Dokument aus Mutation
	div.kern-hint(
		:id="`${id}-hint`"
	) Nur Mutationen, für die ein PDF erzeugt werden kann, stehen zur Auswahl.
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="id"
			v-model="model"
			:aria-describedby="`${id}-hint`"
		)
			option(:value="null") Bitte auswählen
			option(
				v-for="mutation of mutations"
				:key="mutation.id"
				:value="mutation.id"
			)
				| {{ mutation.table }} ({{ formatWorkflowMutationAction(mutation.action) }})
</template>
