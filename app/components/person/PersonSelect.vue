<script setup lang="ts">
import type { DestructureArray } from '#shared/types'

const { id, readonly = false } = defineProps<{
	id: string
	readonly?: boolean
}>()

const localId = useId()

const { data } = useFetch('/api/persons')

const model = defineModel<DestructureArray<typeof data.value> | null>({
	required: true,
})

const filter = ref('')
const filteredList = computed(() =>
	filter.value.length > 0
		? (data.value?.filter((person) =>
			[
				person.callName,
				person.firstName,
				person.lastName,
				person.email,
			].some((field) => field?.toUpperCase().includes(filter.value.toUpperCase())),
		).slice(0, 10) ?? [])
		: [],
)

const editButton = useTemplateRef<HTMLButtonElement>('edit-button')
async function selectPerson(person: DestructureArray<typeof data.value>) {
	filter.value = ''
	model.value = person
	await nextTick()
	if(editButton.value) {
		editButton.value.focus()
	}
}
</script>

<template lang="pug">
.flex.flex-row.gap-2.w-full(v-if="model")
	input.flex-1.kern-form-input__input(
		:id="id"
		:value="formatPerson(model)"
		readonly
	)
	button.kern-btn.kern-btn--tertiary(
		v-if="!readonly"
		ref="edit-button"
		@click="model = null"
	)
		span.kern-icon.kern-icon--edit(aria-hidden="true")
		span.kern-label.kern-sr-only Neu auswählen
table.kern-table(v-else)
	caption.kern-title Personensuche
	thead.kern-table__head
		tr.kern-table__row
			td.kern-table__cell(colspan="2")
				.kern-form-input
					label.kern-label(:for="localId") Suche
					input.kern-form-input__input(
						:id="localId"
						v-model="filter"
						type="text"
						placeholder="Nach Name oder E-Mail-Adresse suchen..."
					)
		tr.kern-table__row
			th.kern-table__header(scope="col") Name
			th.kern-table__header(scope="col") Auswahl
	tbody.kern-table__body
		tr.kern-table__row(v-if="filter.length < 1")
			td.kern-table__cell(colspan="2") Bitte mindestens ein Zeichen eingeben, um die Suche zu starten.
		tr.kern-table__row(v-else-if="filteredList?.length === 0")
			td.kern-table__cell(colspan="2") Keine Einträge gefunden.
		tr.kern-table__row(
			v-for="person of filteredList"
			:key="person.id"
		)
			td.kern-table__cell {{ formatPerson(person) }}
			td.kern-table__cell
				button.kern-btn.kern-btn--tertiary(@click="selectPerson(person)")
					span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
					span.kern-label.kern-sr-only Auswählen
</template>
