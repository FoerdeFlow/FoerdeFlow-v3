<script setup lang="ts">
import type { BudgetPlanItemDiffItem } from '#shared/utils/budgetPlanItemsDiff'
import type { Budget, BudgetPlanItemInput, WorkflowCustomBudgetPlanItemsFormModel } from '~/types'

defineOptions({
	summaryItems: 2,
})

const id = useId()

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	/** The organization item whose budgets may be picked, if it is restricted. */
	organizationItem?: string | null
	presets?: unknown
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<WorkflowCustomBudgetPlanItemsFormModel>({
	required: true,
})

// The budget is only picked to narrow down the plans to pick from, so it does
// not travel with the application. A stored mutation carries the budget of its
// plan under the same name, which is all the summary needs.
const budget = computed<Budget>({
	get: () => model.value.budget ?? null,
	set: (value) => {
		model.value.budget = value
	},
})

/** The plan the titles in the model belong to, `null` while none are known to. */
const itemsPlan = ref<string | null>(null)

/** The titles as the plan carries them now, the basis the change is shown against. */
const originalItems = ref<BudgetPlanItemInput[]>(model.value.previous?.items ?? [])
const loadFailed = ref(false)

// The plan is picked in the form, so its titles are only known once it is. They
// are loaded into the model, so that the applicant changes the plan as it
// stands instead of writing it anew.
watch(() => model.value.plan?.id ?? null, async (plan) => {
	if(props.readonly || !plan) return

	loadFailed.value = false
	try {
		const loaded = await $fetch(`/api/budgetPlans/${plan}`)
		originalItems.value = loaded.items.map((item) => ({ ...item }))

		if(itemsPlan.value === plan) return

		// Titles that are already there when the plan first arrives come from a
		// draft or from a preset and belong to it, so they are kept. They are
		// only replaced once a different plan is picked.
		const written = itemsPlan.value !== null || model.value.items.length === 0
		itemsPlan.value = plan
		if(!written) return

		model.value.items = loaded.items.map((item) => ({ ...item }))
	} catch(_error) {
		loadFailed.value = true
	}
}, { immediate: true })

// The budget select clears itself once the restriction no longer offers what
// was picked, and the plan below it then has nothing left to belong to.
watch(budget, (value) => {
	if(value) return
	model.value.plan = null
})

/** The titles the change is shown against, from the snapshot where there is one. */
const previousItems = computed(() => model.value.previous?.items ?? originalItems.value)

/**
 * Takes a title that was struck back into the change.
 *
 * It comes back with the id it has in the plan, so that it counts as the title
 * it always was instead of as a new one: adding it anew would drop the row the
 * expense authorizations paid from it point at. It is put back where its
 * ordinal belongs, so that the list keeps its order.
 *
 * @param item - The title as the plan carries it
 */
function restore(item: BudgetPlanItemDiffItem) {
	const index = model.value.items
		.findIndex((entry) => (entry.ord ?? 0) > (item.ord ?? 0))
	const restored = { ...item, id: item.id ?? null } as BudgetPlanItemInput

	if(index === -1) {
		model.value.items.push(restored)
	} else {
		model.value.items.splice(index, 0, restored)
	}
}

function getSummaryDescription(item: BudgetPlanItemInput): string {
	const parts = []
	if(item.revenues) parts.push(`Einnahmen: ${formatCurrency(item.revenues)}`)
	if(item.expenses) parts.push(`Ausgaben: ${formatCurrency(item.expenses)}`)
	const meta = parts.join(', ')
	return item.description ? `${meta} (${item.description})` : meta
}
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'budget-plan-items-plan'")
	BudgetPlanBudgetInput(
		v-if="presets.visible('plan')"
		v-model="budget"
		:organization-item="props.organizationItem"
		:readonly="presets.readonly('plan')"
	)
	.kern-form-input(v-if="budget && presets.visible('plan')")
		label.kern-label(:for="`${id}-plan`") Haushaltsplan
		BudgetPlanSelect(
			:id="`${id}-plan`"
			v-model="model.plan"
			:budget="budget.id"
			:readonly="presets.readonly('plan')"
		)
	KernAlert(
		v-if="loadFailed"
		type="danger"
		:dismissible="false"
		title="Haushaltstitel konnten nicht geladen werden"
		text="Die Haushaltstitel des gewählten Plans konnten nicht abgerufen werden. Bitte laden Sie die Seite neu."
	)
template(v-if="props.selectedItem === 'budget-plan-items-items'")
	BudgetPlanItemsInput(
		v-model="model.items"
		:readonly="presets.readonly('items')"
	)
	h3.kern-heading-small.mt-8 Änderungen gegenüber dem beschlossenen Haushaltsplan
	WorkflowCustomBudgetPlanItemsDiff(
		:previous="previousItems"
		:current="model.items"
		:restorable="!props.readonly && !presets.readonly('items')"
		@restore="restore"
	)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Haushaltsplan"
		:items=`[
			{
				key: 'Haushalt',
				value: formatBudget(budget ?? null),
			},
			{
				key: 'Haushaltsperiode',
				value: formatBudgetPlan(model.plan ?? null),
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'budget-plan-items-plan')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Haushaltstitel"
		:items=`[
			...(model.items.length === 0
				? [
					{
						key: 'Haushaltstitel',
						value: '–',
					},
				]
				: model.items.map((item) => ({
					key: item.title,
					value: getSummaryDescription(item),
				}))
			),
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'budget-plan-items-items')"
	)
	h3.kern-heading-small.mt-8 Änderungen gegenüber dem beschlossenen Haushaltsplan
	WorkflowCustomBudgetPlanItemsDiff(
		:previous="previousItems"
		:current="model.items"
	)
</template>
