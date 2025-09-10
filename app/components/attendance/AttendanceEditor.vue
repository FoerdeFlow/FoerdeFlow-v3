<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { AttendanceStatus, Person } from '~/types'

const props = defineProps<{
	session: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	person: Person
	status: AttendanceStatus
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
	create({ person }: { person?: Person } = {}) {
		openDialog(null, {
			person: person ?? null,
			status: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/attendances/${id}`)
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
	if(!dialog.value || !model.value) return
	try {
		const body = {
			session: props.session,
			person: model.value.person?.id,
			status: model.value.status,
		}
		if(itemId.value) {
			await $fetch(`/api/attendances/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/attendances', {
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
	title="Anwesenheitsstatus bearbeiten"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		AttendancePersonInput(
			v-model="model.person"
			:readonly="Boolean(itemModel?.person)"
		)
		AttendanceStatusInput(
			v-model="model.status"
		)
</template>
