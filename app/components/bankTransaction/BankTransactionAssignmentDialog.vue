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
	counterpartyIsOwnAccount: boolean
	assignments: {
		type: AssignmentType
		budgetPlanItem: { id: string } | null
		budget: { id: string } | null
		paymentOrder: { id: string } | null
		amount: number
		note: string | null
	}[]
}

type AssignmentType = 'planned' | 'reserve' | 'transfer'

interface Row {
	type: AssignmentType
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

/*
 * Meist gehört eine Zahlung vollständig zu einem Ziel. Teilbeträge erscheinen
 * deshalb erst auf Wunsch, oder wenn die Zahlung schon aufgeteilt ist.
 */
const split = ref(false)

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
		split.value = rows.value.length > 1 ||
			(rows.value.length === 1 && rows.value[0]?.amount !== item.amount)
		if(rows.value.length === 0) addRow()
		dialog.value.show()
	},
})

const emit = defineEmits<{
	refresh: []
}>()

const hasTarget = (row: Row) => row.type === 'transfer' ||
	Boolean(row.type === 'planned' ? row.budgetPlanItem : row.budget)

const toAssignment = (row: Row, amount: number | null) => ({
	type: row.type,
	budgetPlanItem: row.type === 'planned' ? row.budgetPlanItem : null,
	budget: row.type === 'reserve' ? row.budget : null,
	paymentOrder: row.type === 'transfer' ? null : row.paymentOrder,
	amount: amount ?? 0,
	note: row.note.trim() || null,
})

// Ohne Aufteilung trägt das eine Ziel den vollen Betrag. Bleibt es leer, wird
// die bisherige Zuordnung entfernt.
const assignments = computed(() => split.value
	? rows.value.map((row) => toAssignment(row, row.amount))
	: rows.value.filter(hasTarget).slice(0, 1).map((row) => toAssignment(row, transaction.value?.amount ?? 0)))

const modified = computed(() => JSON.stringify(initialRows.value.map((row) => toAssignment(row, row.amount))) !==
	JSON.stringify(assignments.value))

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

// Geht das Geld an ein eigenes Konto oder kommt es von dort, ist es meist eine
// Umbuchung, etwa auf das Rücklagenkonto.
function addRow() {
	const transfer = rows.value.length === 0 && transaction.value?.counterpartyIsOwnAccount
	rows.value.push({
		type: transfer ? 'transfer' : 'planned',
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

function startSplit() {
	const [ first ] = rows.value
	if(first) first.amount = transaction.value?.amount ?? null
	split.value = true
}

function clearAssignment() {
	rows.value = []
	addRow()
}

// Das erste Ziel bleibt erhalten und übernimmt wieder den vollen Betrag.
function endSplit() {
	rows.value.splice(1)
	if(rows.value.length === 0) addRow()
	split.value = false
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

const valid = computed(() => split.value
	? remaining.value >= 0 && rows.value.every((row) => (row.amount ?? 0) > 0 && hasTarget(row))
	: assignments.value.length > 0 || initialRows.value.length > 0)

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
				assignments: assignments.value,
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
		p.kern-hint.mb-4(v-if="transaction.counterpartyIsOwnAccount") {{ $t('bankTransaction.assign.ownAccount') }}
		fieldset.kern-fieldset.ff3-assignment(
			v-for="(row, index) of rows"
			:key="index"
		)
			legend.kern-label
				| {{ split ? $t('bankTransaction.assign.part', { number: index + 1 }) : $t('bankTransaction.assign.target') }}
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
							option(value="transfer") {{ $t('bankTransaction.assign.typeTransfer') }}
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
				.kern-form-input(v-else-if="row.type === 'reserve'")
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
				.kern-form-input(v-if="transaction.direction === 'debit' && row.type !== 'transfer'")
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
					v-if="split"
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
					v-if="split"
					type="button"
					@click="removeRow(index)"
				)
					span.kern-icon.kern-icon--delete(aria-hidden="true")
					span.kern-label {{ $t('bankTransaction.assign.remove') }}
		template(v-if="split")
			p.kern-body.mb-4(v-if="remaining >= 0")
				| {{ $t('bankTransaction.assign.remaining', { amount: formatCurrency(remaining, 'amount') }) }}
			p.kern-error.mb-4(
				v-else
				role="alert"
			)
				span.kern-icon.kern-icon--danger(aria-hidden="true")
				span.kern-body {{ $t('bankTransaction.assign.exceeded', { amount: formatCurrency(-remaining) }) }}
			.flex.flex-wrap.gap-2
				button.kern-btn.kern-btn--secondary(
					type="button"
					@click="addRow()"
				)
					span.kern-icon.kern-icon--add(aria-hidden="true")
					span.kern-label {{ $t('bankTransaction.assign.add') }}
				button.kern-btn.kern-btn--tertiary(
					v-if="rows.length <= 1"
					type="button"
					@click="endSplit()"
				)
					span.kern-icon.kern-icon--close(aria-hidden="true")
					span.kern-label {{ $t('bankTransaction.assign.unsplit') }}
		.flex.flex-wrap.gap-2(v-else)
			button.kern-btn.kern-btn--tertiary(
				type="button"
				:aria-describedby="`${id}-split-hint`"
				@click="startSplit()"
			)
				span.kern-icon.kern-icon--add(aria-hidden="true")
				span.kern-label {{ $t('bankTransaction.assign.split') }}
			button.kern-btn.kern-btn--tertiary(
				v-if="assignments.length > 0"
				type="button"
				@click="clearAssignment()"
			)
				span.kern-icon.kern-icon--delete(aria-hidden="true")
				span.kern-label {{ $t('bankTransaction.assign.clear') }}
		p.kern-hint(
			v-if="!split"
			:id="`${id}-split-hint`"
		) {{ $t('bankTransaction.assign.splitHint') }}
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
