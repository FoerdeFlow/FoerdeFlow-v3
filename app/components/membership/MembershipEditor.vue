<script lang="ts" setup>
import { FetchError } from 'ofetch'
import type { KernTaskDialog } from '#components'
import type { MembershipEndReason, MembershipType, OrganizationItem, Person } from '~/types'

const props = defineProps<{
	organizationItem: string
	readonly?: boolean
}>()

const emit = defineEmits<{
	refresh: [],
}>()

const itemId = ref<string | null>(null)

const dialog = useTemplateRef<typeof KernTaskDialog>('dialog')

const model = reactive({
	memberType: null as 'person' | 'organizationItem' | null,
	memberPerson: null as Person,
	memberOrganizationItem: null as OrganizationItem,
	membershipType: null as MembershipType,
	comment: null as string | null,
	startDate: null as Date | null,
	endDate: null as Date | null,
	endReason: null as MembershipEndReason,
})

defineExpose({
	create: () => {
		if(!dialog.value) return
		model.memberType = null
		model.memberPerson = null
		model.memberOrganizationItem = null
		model.membershipType = null
		model.comment = null
		model.startDate = null
		model.endDate = null
		model.endReason = null
		itemId.value = null
		dialog.value?.show('create')
	},
	edit: async (id: string) => {
		if(!dialog.value) return
		const data = await $fetch(`/api/memberships/${id}`)
		model.memberType = data.memberType
		model.memberPerson = data.memberPerson
		model.memberOrganizationItem = data.memberOrganizationItem
		model.membershipType = data.membershipType
		model.comment = data.comment
		model.startDate = data.startDate ? new Date(data.startDate) : null
		model.endDate = data.endDate ? new Date(data.endDate) : null
		model.endReason = data.endReason
		itemId.value = id
		dialog.value?.show('edit')
	},
})

async function save() {
	if(!dialog.value) return
	const body = {
		memberType: model.memberType,
		memberPerson: model.memberPerson?.id ?? null,
		memberOrganizationItem: model.memberOrganizationItem?.id ?? null,
		membershipType: model.membershipType?.id ?? null,
		comment: model.comment,
		startDate: model.startDate ? model.startDate.toISOString() : null,
		endDate: model.endDate ? model.endDate.toISOString() : null,
		endReason: model.endReason ? model.endReason.id : null,
	}
	try {
		if(itemId.value) {
			await $fetch(`/api/memberships/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/memberships', {
				method: 'POST',
				body: {
					...body,
					organizationItem: props.organizationItem,
				},
			})
		}
		emit('refresh')
		dialog.value.hide()
	} catch(e) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: `Fehler bei der ${itemId.value ? 'Bearbeitung' : 'Erstellung'}`,
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}

type DialogSection = InstanceType<typeof KernTaskDialog>['$props']['sections'][number]
type DialogTask = Omit<DialogSection['tasks'][number], 'id' | 'status'>

const taskSelectMemberModel = computed(() => [
	{
		label: 'Art des Mitglieds',
		value: model.memberType
			? {
				person: 'Person',
				organizationItem: 'Organisationseinheit',
			}[model.memberType]
			: null,
	},
	{
		label: 'Mitglied',
		value: model.memberType === 'person' && model.memberPerson
			? formatPerson(model.memberPerson)
			: model.memberType === 'organizationItem' && model.memberOrganizationItem
				? formatOrganizationItem(model.memberOrganizationItem)
				: null,
	},
] satisfies DialogTask['model'])

const taskSelectMembershipTypeModel = computed(() => ([
	{
		label: 'Mitgliedschaftsart',
		value: model.membershipType
			? formatMembershipType(model.membershipType)
			: null,
	},
	{
		label: 'Besondere Rolle',
		value: model.comment ?? null,
	},
] satisfies DialogTask['model']))

const taskSelectPeriodModel = computed(() => [
	{
		label: 'Beginn der Mitgliedschaft',
		value: model.startDate
			? formatDate(model.startDate)
			: null,
	},
	{
		label: 'Ende der Mitgliedschaft',
		value: model.endDate
			? formatDate(model.endDate)
			: null,
	},
	{
		label: 'Ausgeschieden durch',
		value: model.endReason
			? formatMembershipEndReason(model.endReason)
			: null,
	},
] satisfies DialogTask['model'])

const tasks = computed(() => [
	{
		title: 'Daten der Mitgliedschaft',
		tasks: {
			'select-member': {
				label: 'Mitglied auswählen',
				model: taskSelectMemberModel.value,
			},
			'select-membership-type': {
				label: 'Mitgliedschaftsart und Rolle angeben',
				model: taskSelectMembershipTypeModel.value,
			},
			'select-period': {
				label: 'Zeitraum der Mitgliedschaft angeben',
				model: taskSelectPeriodModel.value,
			},
		},
	},
] as const satisfies {
	title: string
	tasks: Record<string, DialogTask>
}[])

const valid = computed(() => ({
	'select-member':
		(model.memberType === 'person' && Boolean(model.memberPerson)) ||
		(model.memberType === 'organizationItem' && Boolean(model.memberOrganizationItem)),
	'select-membership-type': Boolean(model.membershipType),
	'select-period': true,
}) as const)

const sections = computed(() => tasks.value.map((section) => ({
	...section,
	tasks: Object.entries(section.tasks).map(([ id, task ]) => ({
		id,
		...task,
		status: valid.value[id as keyof typeof section.tasks] ? 'valid' : 'invalid',
	})),
})) satisfies InstanceType<typeof KernTaskDialog>['$props']['sections'])
</script>

<template lang="pug">
KernTaskDialog(
	ref="dialog"
	title="Mitgliedschaft"
	:sections="sections"
	:readonly="props.readonly"
	@save="save"
)
	template(#task-select-member)
		MembershipMemberInput(
			v-model:type="model.memberType"
			v-model:person="model.memberPerson"
			v-model:organization-item="model.memberOrganizationItem"
		)
	template(#task-select-membership-type)
		MembershipMembershipTypeInput(v-model="model.membershipType")
		MembershipComment(v-model="model.comment")
	template(#task-select-period)
		MembershipStartDateInput(v-model="model.startDate")
		MembershipEndDateInput(v-model="model.endDate")
		MembershipEndReasonInput(v-model="model.endReason")
</template>
