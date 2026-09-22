<script setup lang="ts">
import type { DestructureArray } from '#shared/types'

import { LocationAdHocDialog } from '#components'

const props = defineProps<{
	id: string
	// Nur mit einem Gremium tauchen dessen Ad-hoc-Orte in der Auswahl auf.
	organizationItem?: string
	/**
	 * Welche Orte zur Wahl stehen: der Ort eines Termins (alles außer einem
	 * Videokonferenzraum), sein Online-Ort, oder das Gebäude eines Raums.
	 */
	kind?: 'physical' | 'online' | 'building'
	optional?: boolean
}>()

const { data, refresh } = useFetch('/api/locations', {
	query: computed(() => ({ organizationItem: props.organizationItem })),
})

const model = defineModel<DestructureArray<typeof data.value> | null>({
	required: true,
})

const typeOrder = [ 'adHoc', 'building', 'room', 'place', 'external', 'online' ] as const

function selectable(item: DestructureArray<typeof data.value>) {
	switch(props.kind ?? 'physical') {
		case 'building':
			return item.type === 'building'
		case 'online':
			// Ein Ad-hoc-Ort taugt als Online-Ort, sobald ein Link erfasst ist.
			return item.type === 'online' || (item.type === 'adHoc' && Boolean(item.url))
		default:
			return item.type !== 'online'
	}
}

const groups = computed(() => typeOrder
	.map((type) => ({
		type,
		items: (data.value ?? [])
			.filter((item) => item.type === type && selectable(item))
			.sort((a, b) => formatLocation(a).localeCompare(formatLocation(b))),
	}))
	.filter((group) => group.items.length > 0),
)

const adHoc = useTemplateRef<InstanceType<typeof LocationAdHocDialog>>('adHoc')

const selectModel = computed({
	get: () => model.value?.id ?? '',
	set: (v) => {
		if(v === '') {
			model.value = null
			return
		}
		model.value = data.value?.find(({ id }) => id === v) ?? null
	},
})

// Ein frisch erfasster Ort steht noch nicht in der Liste, aus der die Auswahl
// ihren Wert zieht.
async function created(id: string) {
	await refresh()
	selectModel.value = id
}
</script>

<template lang="pug">
.kern-form-input__select-wrapper
	select.kern-form-input__select(
		:id="props.id"
		v-model="selectModel"
	)
		option(
			:disabled="!props.optional"
			value=""
		) {{ props.optional ? $t('location.select.open') : $t('location.select.placeholder') }}
		optgroup(
			v-for="group of groups"
			:key="group.type"
			:label="$t(`location.type.${group.type}`)"
		)
			option(
				v-for="item of group.items"
				:key="item.id"
				:value="item.id"
			) {{ formatLocation(item) }}
template(v-if="props.organizationItem")
	button.kern-btn.kern-btn--tertiary(
		type="button"
		@click="adHoc?.create()"
	)
		span.kern-icon.kern-icon--add(aria-hidden="true")
		span.kern-label {{ $t('location.adHoc.action') }}
	LocationAdHocDialog(
		ref="adHoc"
		:organization-item="props.organizationItem"
		:online="props.kind === 'online'"
		@created="created"
	)
</template>
