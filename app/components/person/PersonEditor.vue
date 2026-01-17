<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { Course, Gender } from '~/types'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

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
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/persons/${id}`)
		openDialog(id, item)
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
	if(!dialog.value) return
	try {
		const body = {
			...model.value,
			course: model.value?.course?.id ?? null,
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
</template>
