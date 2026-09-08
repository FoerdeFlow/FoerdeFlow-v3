<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { Course, Gender } from '~/types'

import { KernDialog } from '#components'

const authStore = useAuthStore()
const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

/**
 * Whether the bank details may be seen and maintained here. Without the
 * permission the field is not shown and never sent, so that saving leaves the
 * bank details of the person untouched.
 */
const bankDetailsVisible = authStore.hasPermission('personBankDetails.read')

interface Model {
	firstName: string
	lastName: string
	email: string
	callName: string | null
	gender: Gender
	pronouns: string | null
	matriculationNumber: number | null
	postalAddress: string | null
	course: Course
	iban: string | null
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
			firstName: '',
			lastName: '',
			email: '',
			callName: null,
			gender: null,
			pronouns: null,
			matriculationNumber: null,
			postalAddress: null,
			course: null,
			iban: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/persons/${id}`)
		openDialog(id, { ...item, iban: 'iban' in item ? item.iban ?? null : null })
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
	try {
		const { iban, ...rest } = model.value
		const body = {
			...rest,
			course: model.value.course?.id ?? null,
			// Left out entirely without the permission, so that a save never
			// clears bank details the editor was not allowed to show.
			...bankDetailsVisible.value ? { iban } : {},
		}
		if(itemId.value) {
			await $fetch(`/api/persons/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/persons', {
				method: 'POST',
				body,
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: `Fehler bei der ${itemId.value ? 'Bearbeitung' : 'Erstellung'}`,
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="`Person ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-container-fluid
			.kern-row
				.kern-col
					PersonFirstNameInput(v-model="model.firstName")
				.kern-col
					PersonLastNameInput(v-model="model.lastName")
			.kern-row
				.kern-col
					PersonEmailInput(v-model="model.email")
			.kern-row
				.kern-col
					PersonCallNameInput(v-model="model.callName")
			.kern-row
				.kern-col
					PersonGenderInput(v-model="model.gender")
				.kern-col
					PersonPronounsInput(v-model="model.pronouns")
			.kern-row
				.kern-col
					PersonMatriculationNumberInput(v-model="model.matriculationNumber")
				.kern-col
					PersonCourseInput(v-model="model.course")
			.kern-row
				.kern-col
					PersonPostalAddressInput(v-model="model.postalAddress")
			.kern-row(v-if="bankDetailsVisible")
				.kern-col
					PersonIbanInput(v-model="model.iban")
</template>
