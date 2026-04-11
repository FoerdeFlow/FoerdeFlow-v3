<script setup lang="ts">
import type { Course, Election, ElectionCommittee, KernTaskListItems, Person } from '~/types'

defineOptions({
	summaryItems: 5,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	processId?: string
	mutationId?: string
	attachments?: string[]
}>()

const emit = defineEmits<{
	select: [item: string]
}>()

interface Model {
	electionCommittee: ElectionCommittee
	candidate: Person
	applicationLetter: string | null
	callName: string | null
	pronouns: string | null
	matriculationNumber: number | null
	course: Course
	postalAddress: string
	photo: File | null
}

const model = defineModel<Model>({
	required: true,
})

const election = ref<Election>(null)

defineExpose({
	title: 'Daten zur Kandidatur',
	tasks: computed(() => [
		{
			id: 'candidate-election-committee',
			label: 'Wahl und Gremium auswählen',
			status: model.value.electionCommittee ? 'done' : 'open',
		},
		{
			id: 'candidate-candidate',
			label: 'Kandidat*in auswählen',
			status: model.value.candidate ? 'done' : 'open',
		},
		{
			id: 'candidate-person',
			label: 'Persönliche Daten erfassen',
			status: model.value.candidate
				? model.value.matriculationNumber && model.value.course && model.value.postalAddress
					? 'done'
					: 'open'
				: 'blocked',
		},
		{
			id: 'candidate-photo',
			label: 'Lichtbild erfassen',
			status: model.value.candidate
				? model.value.photo ? 'done' : 'open'
				: 'blocked',
		},
		{
			id: 'candidate-application-letter',
			label: 'Beschreibung erfassen',
			status: model.value.candidate
				? model.value.applicationLetter ? 'done' : 'open'
				: 'blocked',
		},
	] satisfies KernTaskListItems[number]['tasks']),
})

const photoUrl = computed(() => {
	if(props.processId && props.mutationId) {
		return props.attachments?.includes('photo')
			? `/api/processes/${props.processId}/attachments/${props.mutationId}_photo`
			: null
	}
	return model.value.photo
		? URL.createObjectURL(model.value.photo)
		: null
})
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'candidate-election-committee'")
	.w-full
		.kern-form-input
			label.kern-label(for="election") Wahl
			ElectionSelect(
				id="election"
				v-model="election"
				:readonly="props.readonly"
			)
		.kern-form-input(v-if="election")
			label.kern-label(for="election-committee") Gremium
			ElectionCommitteeSelect(
				id="election-committee"
				v-model="model.electionCommittee"
				:election="election.id"
				:readonly="props.readonly"
			)
template(v-if="props.selectedItem === 'candidate-candidate'")
	CandidateCandidateInput(
		v-model="model.candidate"
		:readonly="props.readonly"
	)
template(v-if="props.selectedItem === 'candidate-person'")
	.kern-row
		.kern-col-12(v-if="model.candidate")
			p.kern-body
				| Hier bitte die persönlichen Daten für {{ formatPerson(model.candidate) }} erfassen.
	.kern-row
		.kern-col-12
			PersonMatriculationNumberInput(
v-model="model.matriculationNumber"
required)
	.kern-row
		.kern-col-12.kern-col-md-6
			PersonCourseInput(
v-model="model.course"
required)
		.kern-col-12.kern-col-md-6
			.kern-form-input
				label.kern-label(for="fsv-of-course") Fachschaft
				CouncilSelect(
					id="fsv-of-course"
					:model-value="model.course?.council ?? null"
					readonly
				)
	.kern-row
		.kern-col-12
			PersonPostalAddressInput(
v-model="model.postalAddress"
required)
	.kern-row
		.kern-col-12
			p.kern-body
				| Solltest du einen anderen Vornamen nutzen, als im System der HAW eingetragen ist, kannst du diesen hier angeben.
		.kern-col-12.kern-col-md-6
			PersonCallNameInput(v-model="model.callName")
		.kern-col-12.kern-col-md-6
			PersonPronounsInput(v-model="model.pronouns")
template(v-if="props.selectedItem === 'candidate-photo'")
	PersonPhotoInput(
		v-model="model.photo"
		:readonly="props.readonly"
	)
	.mt-8(v-if="model.photo && photoUrl")
		p.kern-body
			| Es wurde ein Foto hochgeladen: {{ model.photo.name }} ({{ (model.photo.size / 1024).toFixed(2) }} KB)
		img(
:src="photoUrl"
alt="Vorschaubild"
class="mt-4 max-w-xs border")
		button.mt-4.kern-btn.kern-btn--secondary(@click="model.photo = null")
			span.kern-icon.kern-icon--delete(aria-hidden="true")
			span.kern-label Bild entfernen
template(v-if="props.selectedItem === 'candidate-application-letter'")
	CandidateApplicationLetterInput(
		v-model="model.applicationLetter"
		:readonly="props.readonly"
	)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Angaben zu Wahl und Gremium"
		:items=`[
			{
				key: 'Wahl',
				value: election?.title ?? model.electionCommittee?.election?.title ?? '–',
			},
			{
				key: 'Gremium',
				value: formatOrganizationItem(model.electionCommittee?.committee ?? null) || '–',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'candidate-election-committee')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Angaben zur Kandidat*in"
		:items=`[
			{
				key: 'Kandidat*in',
				value: model.candidate?.firstName + ' ' + model.candidate?.lastName,
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'candidate-candidate')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 3"
		title="Persönliche Daten der Kandidat*in"
		:items=`[
			{
				key: 'Matrikelnummer',
				value: model.matriculationNumber?.toString() ?? '–',
			},
			{
				key: 'Fachschaft',
				value: formatCouncil(model.course?.council ?? null) || '–',
			},
			{
				key: 'Studiengang',
				value: formatCourse(model.course) || '–',
			},
			{
				key: 'Adresse',
				value: model.postalAddress || '–',
			},
			{
				key: 'Selbstgewählter Vorname',
				value: model.callName ?? '–',
			},
			{
				key: 'Pronomen',
				value: model.pronouns ?? '–',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'candidate-person')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 4"
		title="Lichtbild der Kandidat*in"
		:items=`[
			{
				key: 'Lichtbild',
				valueImg: photoUrl || '',
				value: model.photo ? 'vorhanden' : '–',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'candidate-photo')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 5"
		title="Bewerbungsschreiben der Kandidat*in"
		:items=`[
			{
				key: 'Bewerbungsschreiben',
				value: model.applicationLetter || '–',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'candidate-application-letter')"
	)
</template>
