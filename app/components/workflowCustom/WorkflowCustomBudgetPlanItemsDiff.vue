<script setup lang="ts">
import type { BudgetPlanItemChange, BudgetPlanItemDiffItem } from '#shared/utils/budgetPlanItemsDiff'

const props = defineProps<{
	/** The titles as the plan carries them at the moment. */
	previous: BudgetPlanItemDiffItem[]
	/** The titles the change applies for. */
	current: BudgetPlanItemDiffItem[]
	/** Whether a title that was struck may be taken back into the change. */
	restorable?: boolean
}>()

const emit = defineEmits<{
	restore: [item: BudgetPlanItemDiffItem]
}>()

const entries = computed(() => budgetPlanItemsDiff(props.previous, props.current)
	// A title that stays as it is says nothing about the change, so only the
	// ones that are actually touched are listed.
	.filter((entry) => entry.change !== 'unchanged'))

const badges: Record<BudgetPlanItemChange, string> = {
	added: 'kern-badge--success',
	changed: 'kern-badge--info',
	removed: 'kern-badge--danger',
	unchanged: '',
}

/**
 * Describes what a title used to say, so that a reader sees the change without
 * having to hold both versions in their head.
 *
 * @param entry - The entry of the comparison
 * @returns The former values of the changed fields, empty if there are none
 */
function formerValues(entry: ReturnType<typeof budgetPlanItemsDiff>[number]): string {
	const previous = entry.previous
	if(!previous) return ''

	return entry.fields.map((field) => {
		switch(field) {
			case 'ord':
				return `laufende Nummer ${previous.ord ?? '–'}`
			case 'title':
				return `Bezeichnung „${previous.title}“`
			case 'description':
				return `Erläuterung „${previous.description ?? '–'}“`
			case 'revenues':
				return `Einnahmen ${formatCurrency(previous.revenues ?? 0, 'amount')}`
			default:
				return `Ausgaben ${formatCurrency(previous.expenses ?? 0, 'amount')}`
		}
	}).join(', ')
}
</script>

<template lang="pug">
KernTable(
	caption="Übersicht der Änderungen"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:columns=`[
		{
			name: 'change',
			width: '9em',
		},
		{
			name: 'title',
		},
		{
			name: 'revenues',
			width: '8em',
			class: 'numeric',
		},
		{
			name: 'expenses',
			width: '8em',
			class: 'numeric',
		},
	]`
	:data="entries"
	:show-actions="props.restorable"
)
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="item.change === 'removed' && item.previous"
			@click="emit('restore', item.previous)"
		)
			span.kern-icon.kern-icon--autorenew(aria-hidden="true")
			span.kern-label Wiederherstellen
	template(#change-header)
		| Änderung
	template(#change-body="{ item }")
		span.kern-badge(:class="badges[item.change]")
			span.kern-label.kern-label--small {{ budgetPlanItemChangeLabel(item.change) }}
	template(#title-header)
		| {{ $t('budgetPlanItem.field.title') }}
	template(#title-body="{ item }")
		template(v-if="(item.current ?? item.previous)?.ord")
			span.kern-body--small
				| ({{ (item.current ?? item.previous)?.ord }})
			| &nbsp;
		span.kern-body {{ (item.current ?? item.previous)?.title }}
		template(v-if="(item.current ?? item.previous)?.description")
			br
			span.kern-body.kern-body--small {{ (item.current ?? item.previous)?.description }}
		template(v-if="formerValues(item)")
			br
			span.kern-body.kern-body--small bisher: {{ formerValues(item) }}
	template(#revenues-header)
		| {{ $t('budgetPlanItem.field.revenues') }}
	template(#revenues-body="{ item }")
		| {{ formatCurrency((item.current ?? item.previous)?.revenues ?? null) }}
	template(#expenses-header)
		| {{ $t('budgetPlanItem.field.expenses') }}
	template(#expenses-body="{ item }")
		| {{ formatCurrency((item.current ?? item.previous)?.expenses ?? null) }}
KernAlert(
	v-if="entries.length === 0"
	type="info"
	:dismissible="false"
	title="Keine Änderungen"
	text="Die Haushaltstitel entsprechen dem beschlossenen Haushaltsplan."
)
</template>
