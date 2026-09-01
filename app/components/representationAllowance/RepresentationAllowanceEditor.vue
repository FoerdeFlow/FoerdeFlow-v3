<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { RepresentationAllowancePeriodUnit, RepresentationAllowanceRecipientInput } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	organizationItem: string
	readonly?: boolean
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	title: string
	description: string | null
	periodUnit: RepresentationAllowancePeriodUnit
	startDate: Date | null
	endDate: Date | null
	recipients: RepresentationAllowanceRecipientInput[]
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	create() {
		openDialog(null, {
			title: '',
			description: null,
			periodUnit: 'month',
			startDate: null,
			endDate: null,
			recipients: [],
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/representationAllowances/${id}`)
		openDialog(id, {
			title: item.title,
			description: item.description,
			periodUnit: item.periodUnit,
			startDate: item.startDate ? new Date(item.startDate) : null,
			endDate: item.endDate ? new Date(item.endDate) : null,
			recipients: item.recipients.map((recipient) => ({
				id: recipient.id,
				ord: recipient.ord,
				person: recipient.person,
				amount: recipient.amount,
			})),
		})
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

async function save() {
	if(!dialog.value || !model.value) return

	const endDate = model.value.periodUnit === 'once'
		? null
		: serializeDate(model.value.endDate)

	try {
		const encodeRecipients = (keepIds: boolean) =>
			model.value?.recipients.map((recipient) => ({
				...keepIds && typeof recipient.id === 'string' ? { id: recipient.id } : {},
				ord: recipient.ord,
				person: recipient.person?.id,
				amount: recipient.amount,
			})) ?? []

		const body = {
			organizationItem: props.organizationItem,
			title: model.value.title,
			description: model.value.description,
			periodUnit: model.value.periodUnit,
			startDate: serializeDate(model.value.startDate),
			endDate,
		}
		if(itemId.value) {
			await $fetch(`/api/representationAllowances/${itemId.value}`, {
				method: 'PUT',
				body: {
					...body,
					recipients: encodeRecipients(true),
				},
			})
		} else {
			await $fetch('/api/representationAllowances', {
				method: 'POST',
				body: {
					...body,
					recipients: encodeRecipients(false),
				},
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: itemId.value
					? t('representationAllowance.edit.error.title')
					: t('representationAllowance.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('representationAllowance.edit.error.message')
					: t('representationAllowance.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('representationAllowance.edit.title') : $t('representationAllowance.create.title')"
	:modal="modified"
	:readonly="props.readonly"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		RepresentationAllowanceTitleInput(
			v-model="model.title"
			:readonly="props.readonly"
		)
		RepresentationAllowanceDescriptionInput(
			v-model="model.description"
			:readonly="props.readonly"
		)
		RepresentationAllowancePeriodUnitInput(
			v-model="model.periodUnit"
			:readonly="props.readonly"
		)
		.kern-fieldset__body.kern-fieldset__body--horizontal
			RepresentationAllowanceStartDateInput.flex-1(
				v-model="model.startDate"
				:period-unit="model.periodUnit"
				:readonly="props.readonly"
			)
			RepresentationAllowanceEndDateInput.flex-1(
				v-if="model.periodUnit !== 'once'"
				v-model="model.endDate"
				:readonly="props.readonly"
			)
		RepresentationAllowanceRecipientsInput(
			v-model="model.recipients"
			:period-unit="model.periodUnit"
		)
</template>
