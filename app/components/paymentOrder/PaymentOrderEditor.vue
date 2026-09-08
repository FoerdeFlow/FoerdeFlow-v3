<script setup lang="ts">
import { FetchError } from 'ofetch'

import type {
	Budget,
	BudgetPlan,
	BudgetPlanItem,
	ExpenseAuthorization,
	PaymentOrderRecipientType,
	Person,
} from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	type: 'planned' | 'reserve'
	budgetPlan?: BudgetPlan
	budget?: Budget
	readonly?: boolean
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	budgetPlanItem: BudgetPlanItem
	budget: Budget
	expenseAuthorization: ExpenseAuthorization
	recipientType: PaymentOrderRecipientType
	recipientPerson: Person
	recipientName: string | null
	recipientIban: string | null
	purpose: string | null
	title: string
	description: string | null
	amount: number
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

/** The plan the payment is made from, which is what the selects filter by. */
const budgetPlan = computed(() =>
	model.value?.budgetPlanItem?.plan?.id ?? props.budgetPlan?.id ?? null)

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(toRaw(data))
	model.value = structuredClone(toRaw(data))
	dialog.value.show()
}

defineExpose({
	create() {
		openDialog(null, {
			budgetPlanItem: null,
			budget: null,
			expenseAuthorization: null,
			recipientType: 'reimbursement',
			recipientPerson: null,
			recipientName: null,
			recipientIban: null,
			purpose: null,
			title: '',
			description: null,
			amount: 0,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/paymentOrders/${id}`)
		openDialog(id, {
			...item,
			// Only the fields needed to name the member are handed out here, the
			// rest of their data is guarded by the permission on persons. That is
			// all the select shows of a person that is already picked.
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
			recipientPerson: item.recipientPerson as unknown as Person,
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
	// Only the fields of the chosen kind of recipient are sent, the others are
	// cleared: the table only accepts one of the two sets at a time.
	const reimbursement = model.value.recipientType === 'reimbursement'
	try {
		const body = {
			type: props.type,
			budgetPlanItem: model.value.budgetPlanItem?.id ?? null,
			budget: props.budget?.id ?? null,
			expenseAuthorization: model.value.expenseAuthorization?.id ?? null,
			recipientType: model.value.recipientType,
			recipientPerson: reimbursement ? model.value.recipientPerson?.id ?? null : null,
			recipientName: reimbursement ? null : model.value.recipientName,
			recipientIban: reimbursement ? null : model.value.recipientIban,
			purpose: reimbursement ? null : model.value.purpose,
			title: model.value.title,
			description: model.value.description,
			amount: model.value.amount,
		}
		if(itemId.value) {
			await $fetch(`/api/paymentOrders/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/paymentOrders', {
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
				title: itemId.value
					? t('paymentOrder.edit.error.title')
					: t('paymentOrder.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('paymentOrder.edit.error.message')
					: t('paymentOrder.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('paymentOrder.edit.title') : $t('paymentOrder.create.title')"
	:modal="modified"
	:readonly="props.readonly"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		PaymentOrderBudgetPlanItemInput(
			v-if="props.budgetPlan"
			v-model="model.budgetPlanItem"
			:budget-plan="props.budgetPlan"
			:readonly="props.readonly"
		)
		PaymentOrderExpenseAuthorizationInput(
			v-model="model.expenseAuthorization"
			:budget-plan="budgetPlan"
			:budget="props.budgetPlan ? null : props.budget?.id ?? null"
			:readonly="props.readonly"
		)
		PaymentOrderRecipientTypeInput(
			v-model="model.recipientType"
			:readonly="props.readonly"
		)
		PaymentOrderRecipientPersonInput(
			v-if="model.recipientType === 'reimbursement'"
			v-model="model.recipientPerson"
			:readonly="props.readonly"
		)
		template(v-else)
			PaymentOrderRecipientNameInput(
				v-model="model.recipientName"
				:readonly="props.readonly"
			)
			PaymentOrderRecipientIbanInput(
				v-model="model.recipientIban"
				:readonly="props.readonly"
			)
			PaymentOrderPurposeInput(
				v-model="model.purpose"
				:readonly="props.readonly"
			)
		PaymentOrderTitleInput(
			v-model="model.title"
			:readonly="props.readonly"
		)
		PaymentOrderDescriptionInput(
			v-model="model.description"
			:readonly="props.readonly"
		)
		PaymentOrderAmountInput(
			v-model="model.amount"
			:readonly="props.readonly"
		)
</template>
