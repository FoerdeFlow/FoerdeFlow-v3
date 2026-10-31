<script setup lang="ts">
import type { TravelPermitSummary } from '~/types'

const id = useId()

const props = defineProps<{
	/** What the permit is picked for, only permits that allow it are offered. */
	purpose: 'advance' | 'claim'
	readonly?: boolean
}>()

const model = defineModel<TravelPermitSummary | null>({
	required: true,
})

const route = useRoute()

const { data } = useFetch('/api/travelPermits', {
	immediate: !props.readonly,
	default: () => [],
})

const eligible = (permit: TravelPermitSummary) => props.purpose === 'advance'
	? !permit.advance && !permit.claim
	: !permit.claim && travelClaimWindow(permit.endDate) === 'open'

const permits = computed(() => data.value.filter(eligible))

// The page of a permit links here with the permit in the query, so that it is
// picked right away.
watch(permits, (items) => {
	if(model.value || props.readonly) return
	const preselected = route.query.travelPermit
	model.value = items.find((item) => item.id === preselected) ?? null
}, { immediate: true })

const selectModel = computed({
	get: () => model.value?.id ?? '',
	set: (v) => {
		model.value = permits.value.find((item) => item.id === v) ?? null
	},
})

const label = (permit: TravelPermitSummary) =>
	`${permit.title} (${formatDate(permit.startDate, 'compact')} – ${formatDate(permit.endDate, 'compact')})`
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Dienstreisegenehmigung
	.kern-hint(
		v-if="!props.readonly"
		:id="`${id}-hint`"
	)
		template(v-if="props.purpose === 'advance'")
			| Angeboten werden Ihre Genehmigungen, auf die noch kein Vorschuss gezahlt und keine Erstattung beantragt wurde.
		template(v-else)
			| Angeboten werden Ihre Genehmigungen, deren Reise beendet ist und deren Frist von {{ travelClaimPeriodDays }} Tagen noch läuft.
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="id"
			v-model="selectModel"
			:disabled="props.readonly"
			:aria-describedby="props.readonly ? undefined : `${id}-hint`"
		)
			option(value="") - Bitte wählen -
			option(
				v-if="model && !permits.some((item) => item.id === model?.id)"
				:value="model.id"
			) {{ label(model) }}
			option(
				v-for="item of permits"
				:key="item.id"
				:value="item.id"
			) {{ label(item) }}
</template>
