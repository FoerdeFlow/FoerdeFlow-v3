<script setup lang="ts">
import type { WorkflowCustomPersonFormModel } from '~/types'

defineOptions({
	summaryItems: 2,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	presets?: unknown
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<WorkflowCustomPersonFormModel>({
	required: true,
})

const genderLabels: Record<string, string> = {
	male: 'Männlich',
	female: 'Weiblich',
	non_binary: 'Nicht-binär',
	diverse: 'Divers',
}
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'person-name'")
	.kern-row
		.kern-col-12
			p.kern-body
				| Solltest du einen anderen Vornamen nutzen, als im System der HAW eingetragen ist, kannst du diesen hier angeben.
		.kern-col-12(v-if="presets.visible('callName')")
			PersonCallNameInput(
				v-model="model.callName"
				:readonly="presets.readonly('callName')"
			)
		.kern-col-12.kern-col-md-6(v-if="presets.visible('pronouns')")
			PersonPronounsInput(
				v-model="model.pronouns"
				:readonly="presets.readonly('pronouns')"
			)
		.kern-col-12.kern-col-md-6(v-if="presets.visible('gender')")
			PersonGenderInput(
				v-model="model.gender"
				:readonly="presets.readonly('gender')"
			)
template(v-if="props.selectedItem === 'person-contact'")
	.kern-row(v-if="presets.visible('matriculationNumber')")
		.kern-col-12
			PersonMatriculationNumberInput(
				v-model="model.matriculationNumber"
				:readonly="presets.readonly('matriculationNumber')"
			)
	.kern-row(v-if="presets.visible('course')")
		.kern-col-12.kern-col-md-6
			PersonCourseInput(
				v-model="model.course"
				:readonly="presets.readonly('course')"
			)
		.kern-col-12.kern-col-md-6
			.kern-form-input
				label.kern-label(for="fsv-of-course") Fachschaft
				CouncilSelect(
					id="fsv-of-course"
					:model-value="model.course?.council ?? null"
					readonly
				)
	.kern-row(v-if="presets.visible('postalAddress')")
		.kern-col-12
			PersonPostalAddressInput(
				v-model="model.postalAddress"
				:readonly="presets.readonly('postalAddress')"
			)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Name und Pronomen"
		:items=`[
			{
				key: 'Selbstgewählter Vorname',
				value: model.callName ?? '–',
			},
			{
				key: 'Pronomen',
				value: model.pronouns ?? '–',
			},
			{
				key: 'Geschlecht',
				value: model.gender ? genderLabels[model.gender] ?? model.gender : '–',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'person-name')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Matrikelnummer, Studiengang und Anschrift"
		:items=`[
			{
				key: 'Matrikelnummer',
				value: model.matriculationNumber?.toString() ?? '–',
			},
			{
				key: 'Studiengang',
				value: formatCourse(model.course) || '–',
			},
			{
				key: 'Fachschaft',
				value: formatCouncil(model.course?.council ?? null) || '–',
			},
			{
				key: 'Anschrift',
				value: model.postalAddress ?? '–',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'person-contact')"
	)
</template>
