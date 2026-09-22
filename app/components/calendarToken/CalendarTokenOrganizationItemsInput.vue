<script setup lang="ts">
const id = useId()

const { data } = await useFetch('/api/organizationItems', { default: () => [] })

const model = defineModel<string[]>({ required: true })

interface TreeItem {
	id: string
	code: string
	name: string
	children: TreeItem[]
}

// Der Endpunkt liefert einen Baum. Die Ebene steht als Gedankenstrich im Namen
// und nicht bloß als Einrückung, damit eine Vorlesehilfe sie ebenfalls nennt —
// so hält es auch OrganizationItemSelect.
function flatten(tree: TreeItem[], prefix = ''): { value: string, label: string }[] {
	return tree.flatMap((item) => [
		{ value: item.id, label: `${prefix}${formatOrganizationItem(item)}` },
		...flatten(item.children, `${prefix}— `),
	])
}

const options = computed(() => flatten(data.value))

// Der Zustand kommt aus dem Ereignis und nicht aus dem Template: dessen
// Ausdrücke sind JavaScript, eine TypeScript-Umdeutung schlüge dort zur
// Laufzeit fehl.
function toggle(value: string, event: Event) {
	const { checked } = event.target as HTMLInputElement
	model.value = checked
		? [ ...model.value, value ]
		: model.value.filter((item) => item !== value)
}
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label {{ $t('calendarToken.input.organizationItems.label') }}
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('calendarToken.input.organizationItems.hint') }}
	.kern-fieldset__body(
		:aria-describedby="`${id}-hint`"
	)
		.kern-form-check(
			v-for="option of options"
			:key="option.value"
		)
			input.kern-form-check__checkbox(
				:id="`${id}-${option.value}`"
				type="checkbox"
				:checked="model.includes(option.value)"
				@change="toggle(option.value, $event)"
			)
			label.kern-label(
				:for="`${id}-${option.value}`"
			) {{ option.label }}
</template>
