<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { KernDialog } from '#components'

const props = defineProps<{
	bankAccount: string
}>()

const { t } = useI18n()

interface Transaction {
	id: string
	bookingDate: string
	direction: 'credit' | 'debit'
	amount: number
	counterpartyName: string | null
	purpose: string | null
	additionalInfo: string | null
	assignments: {
		type: 'planned' | 'reserve'
		budgetPlanItem: { id: string } | null
		budget: { id: string } | null
		paymentOrder: { id: string } | null
		amount: number
		note: string | null
	}[]
}

interface Row {
	type: 'planned' | 'reserve'
	budgetPlanItem: string | null
	budget: string | null
	paymentOrder: string | null
	amount: number | null
	note: string
}

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const transaction = ref<Transaction | null>(null)
const initialRows = ref<Row[]>([])
const rows = ref<Row[]>([])

async function loadTargets() {
	return await $fetch(`/api/bankAccounts/${props.bankAccount}/assignmentTargets`)
}
const targets = ref<Awaited<ReturnType<typeof loadTargets>> | null>(null)

defineExpose({
	async assign(item: Transaction) {
		if(!dialog.value) return
		targets.value = await loadTargets()
		transaction.value = item
		initialRows.value = item.assignments.map((assignment) => ({
			type: assignment.type,
			budgetPlanItem: assignment.budgetPlanItem?.id ?? null,
			budget: assignment.budget?.id ?? null,
			paymentOrder: assignment.paymentOrder?.id ?? null,
			amount: assignment.amount,
			note: assignment.note ?? '',
		}))
		rows.value = structuredClone(toRaw(initialRows.value))
		if(rows.value.length === 0) addRow()
		dialog.value.show()
	},
})

const emit = defineEmits<{
	refresh: []
}>()

const modified = computed(() => JSON.stringify(initialRows.value) !== JSON.stringify(rows.value))

const remaining = computed(() => currencySum(
	transaction.value?.amount ?? 0,
	...rows.value.map((row) => -(row.amount ?? 0)),
))

/*
 * Die Pläne, deren Zeitraum den Buchungstag enthält, stehen vorne, weil die
 * Zahlung meist dorthin gehört.
 */
const planGroups = computed(() => {
	const day = transaction.value?.bookingDate ?? ''
	return (targets.value?.budgets ?? [])
		.flatMap((budget) => budget.plans.map((plan) => {
			const current = plan.startDate <= day && day <= plan.endDate
			return {
				id: plan.id,
				current,
				label: `${formatBudget(budget)} · ${formatBudgetPlan(plan)}` +
					(current ? ` (${t('bankTransaction.assign.currentPeriod')})` : ''),
				items: plan.items,
			}
		}))
		.sort((a, b) => Number(b.current) - Number(a.current))
})

const budgetOptions = computed(() => targets.value?.budgets ?? [])

const paymentOrderOptions = computed(() => targets.value?.paymentOrders ?? [])

const hasTargets = computed(() => budgetOptions.value.length > 0)

function addRow() {
	rows.value.push({
		type: 'planned',
		budgetPlanItem: null,
		budget: null,
		paymentOrder: null,
		amount: remaining.value > 0 ? remaining.value : null,
		note: '',
	})
}

function removeRow(index: number) {
	rows.value.splice(index, 1)
}

// Eine Zahlungsanweisung legt fest, worauf gebucht wird.
function onPaymentOrderChange(row: Row) {
	const order = paymentOrderOptions.value.find((item) => item.id === row.paymentOrder)
	if(!order) return
	row.type = order.type
	row.budgetPlanItem = order.budgetPlanItem
	row.budget = order.budget
}

// Wer das Ziel von Hand ändert, löst die Zahlung von der Anweisung.
function onTargetChange(row: Row) {
	const order = paymentOrderOptions.value.find((item) => item.id === row.paymentOrder)
	if(!order) return
	if(order.type !== row.type || order.budgetPlanItem !== row.budgetPlanItem || order.budget !== row.budget) {
		row.paymentOrder = null
	}
}

function onTypeChange(row: Row) {
	row.budgetPlanItem = null
	row.budget = null
	onTargetChange(row)
}

const valid = computed(() => remaining.value >= 0 && rows.value.every((row) =>
	(row.amount ?? 0) > 0 && (row.type === 'planned' ? row.budgetPlanItem : row.budget)))

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

async function save() {
	if(!dialog.value || !transaction.value) return
	try {
		await $fetch(`/api/bankTransactions/${transaction.value.id}/assignments`, {
			method: 'PUT',
			body: {
				assignments: rows.value.map((row) => ({
					type: row.type,
					budgetPlanItem: row.type === 'planned' ? row.budgetPlanItem : null,
					budget: row.type === 'reserve' ? row.budget : null,
					paymentOrder: row.paymentOrder,
					amount: row.amount ?? 0,
					note: row.note.trim() || null,
				})),
			},
		})
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: t('bankTransaction.assign.error.title'),
				text: e.data?.message ?? t('bankTransaction.assign.error.message'),
			})
		}
	}
}

const id = useId()
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="$t('bankTransaction.assign.title')"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="transaction")
		dl.ff3-transaction.mb-4
			dt.kern-label {{ $t('bankTransaction.field.bookingDate') }}
			dd.kern-body {{ formatDate(transaction.bookingDate, 'compact') }}
			dt.kern-label {{ $t('bankTransaction.field.counterparty') }}
			dd.kern-body {{ transaction.counterpartyName ?? transaction.additionalInfo ?? '–' }}
			dt.kern-label {{ $t('bankTransaction.field.purpose') }}
			dd.kern-body {{ transaction.purpose ?? '–' }}
			dt.kern-label {{ $t('bankTransaction.field.amount') }}
			dd.kern-body {{ formatCurrency(getSignedAmount(transaction), 'amount') }}
		p.kern-body(v-if="!hasTargets") {{ $t('bankTransaction.assign.noTargets') }}
		fieldset.kern-fieldset.ff3-assignment(
			v-for="(row, index) of rows"
			:key="index"
		)
			legend.kern-label Teilbetrag {{ index + 1 }}
			.kern-fieldset__body
				.kern-form-input
					label.kern-label(:for="`${id}-${index}-type`") {{ $t('bankTransaction.assign.type') }}
					.kern-form-input__select-wrapper
						select.kern-form-input__select(
							:id="`${id}-${index}-type`"
							v-model="row.type"
							@change="onTypeChange(row)"
						)
							option(value="planned") {{ $t('bankTransaction.assign.typePlanned') }}
							option(value="reserve") {{ $t('bankTransaction.assign.typeReserve') }}
				.kern-form-input(v-if="row.type === 'planned'")
					label.kern-label(:for="`${id}-${index}-item`") {{ $t('bankTransaction.assign.budgetPlanItem') }}
					.kern-form-input__select-wrapper
						select.kern-form-input__select(
							:id="`${id}-${index}-item`"
							v-model="row.budgetPlanItem"
							@change="onTargetChange(row)"
						)
							option(
								disabled
								:value="null"
							) - Bitte wählen -
							optgroup(
								v-for="group of planGroups"
								:key="group.id"
								:label="group.label"
							)
								option(
									v-for="item of group.items"
									:key="item.id"
									:value="item.id"
								) {{ formatBudgetPlanItem(item) }}
				.kern-form-input(v-else)
					label.kern-label(:for="`${id}-${index}-budget`") {{ $t('bankTransaction.assign.budget') }}
					.kern-form-input__select-wrapper
						select.kern-form-input__select(
							:id="`${id}-${index}-budget`"
							v-model="row.budget"
							@change="onTargetChange(row)"
						)
							option(
								disabled
								:value="null"
							) - Bitte wählen -
							option(
								v-for="budget of budgetOptions"
								:key="budget.id"
								:value="budget.id"
							) {{ formatBudget(budget) }}
				.kern-form-input(v-if="transaction.direction === 'debit'")
					label.kern-label(:for="`${id}-${index}-order`")
						| {{ $t('bankTransaction.assign.paymentOrder') }}
						|
						| #[span.kern-label__optional - Optional]
					.kern-form-input__select-wrapper
						select.kern-form-input__select(
							:id="`${id}-${index}-order`"
							v-model="row.paymentOrder"
							@change="onPaymentOrderChange(row)"
						)
							option(:value="null") {{ $t('bankTransaction.assign.paymentOrderNone') }}
							option(
								v-for="order of paymentOrderOptions"
								:key="order.id"
								:value="order.id"
							) {{ order.title }} ({{ formatCurrency(order.amount) }})
				KernCurrencyInput(
					v-model="row.amount"
					:label="$t('bankTransaction.assign.amount')"
				)
				.kern-form-input
					label.kern-label(:for="`${id}-${index}-note`")
						| {{ $t('bankTransaction.assign.note') }}
						|
						| #[span.kern-label__optional - Optional]
					input.kern-form-input__input(
						:id="`${id}-${index}-note`"
						v-model="row.note"
						type="text"
						maxlength="256"
					)
				button.kern-btn.kern-btn--tertiary.self-start(
					type="button"
					@click="removeRow(index)"
				)
					span.kern-icon.kern-icon--delete(aria-hidden="true")
					span.kern-label {{ $t('bankTransaction.assign.remove') }}
		p.kern-body.mb-4(v-if="remaining >= 0")
			| {{ $t('bankTransaction.assign.remaining', { amount: formatCurrency(remaining, 'amount') }) }}
		p.kern-error.mb-4(
			v-else
			role="alert"
		)
			span.kern-icon.kern-icon--danger(aria-hidden="true")
			span.kern-body {{ $t('bankTransaction.assign.exceeded', { amount: formatCurrency(-remaining) }) }}
		button.kern-btn.kern-btn--secondary(
			v-if="hasTargets"
			type="button"
			@click="addRow()"
		)
			span.kern-icon.kern-icon--add(aria-hidden="true")
			span.kern-label {{ $t('bankTransaction.assign.add') }}
</template>

<style scoped>
.ff3-transaction {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 0.25rem 1rem;
}

.ff3-assignment {
	margin-bottom: 1rem;
}
</style>
