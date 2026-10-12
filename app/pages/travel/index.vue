<script setup lang="ts">
import type { InternalApi } from 'nitropack'

import { FetchError } from 'ofetch'

import type {
	TravelPermitCar,
	TravelPermitKind,
	TravelPermitOccasion,
	TravelPermitSpecialInterest,
	TravelPermitTravelerBasis,
} from '#shared/utils/travel'
import type { KernCardNavItems, OrganizationItem, TravelPermitTravelerInput } from '~/types'

const authStore = useAuthStore()
authStore.requireLogin()

const { data: permits } = useFetch('/api/travelPermits')
const { data: myWorkflows } = useFetch('/api/workflows', {
	query: {
		filter: 'mine',
	},
})
const { data: claimWorkflows } = useFetch('/api/travelPermits/claimWorkflows')

/** The workflows the user may start, the only ones worth offering. */
const startable = computed(() => new Set((myWorkflows.value ?? []).map((workflow) => workflow.id)))

/**
 * The facts of a journey that decide which body grants the permit (§ 3). They
 * are asked here once, so that the applicant does not have to know the rules.
 */
interface Facts {
	kind: TravelPermitKind
	domestic: boolean
	startDate: Date | null
	occasion: TravelPermitOccasion
	travelerBasis: TravelPermitTravelerBasis
	specialInterest: TravelPermitSpecialInterest
	car: TravelPermitCar
	carsharingEstimate: number | null
	initiatorOrganizationItem: OrganizationItem
	travelers: TravelPermitTravelerInput[]
}

const facts = ref<Facts>({
	kind: 'single',
	domestic: true,
	startDate: null,
	occasion: 'other',
	travelerBasis: 'officeHolder',
	specialInterest: 'none',
	car: 'none',
	carsharingEstimate: null,
	initiatorOrganizationItem: null,
	travelers: [],
})

const kindOptions = travelPermitKindList.map((value) => ({ value, label: formatTravelPermitKind(value) }))
const occasionOptions = travelPermitOccasionList
	.map((value) => ({ value, label: formatTravelPermitOccasion(value) }))
const travelerBasisOptions = travelPermitTravelerBasisList
	.map((value) => ({ value, label: formatTravelPermitTravelerBasis(value) }))
const specialInterestOptions = travelPermitSpecialInterestList
	.map((value) => ({ value, label: formatTravelPermitSpecialInterest(value) }))
const carOptions = travelPermitCarList.map((value) => ({ value, label: formatTravelPermitCar(value) }))

const share = computed(() => travelPermitLimits({ ...facts.value, advanceAmount: null }, null).share)

const factsComplete = computed(() => !!facts.value.startDate && facts.value.travelers.length > 0 &&
	facts.value.travelers.every((traveler) => traveler.person))

type Verdicts = InternalApi['/api/travelPermits/eligibleWorkflows']['post']
const verdicts = ref<Verdicts | null>(null)

const alertStore = useAlertStore()

async function findWorkflows() {
	try {
		// Typed by hand, the inference of the route types gives up on this body.
		const url = '/api/travelPermits/eligibleWorkflows'
		verdicts.value = await $fetch<Verdicts>(url, {
			method: 'POST',
			body: {
				...facts.value,
				startDate: serializeDate(facts.value.startDate),
				carsharingEstimate: facts.value.car === 'carsharing'
					? facts.value.carsharingEstimate ?? 0
					: null,
				initiatorOrganizationItem: facts.value.initiatorOrganizationItem?.id ?? null,
				travelers: facts.value.travelers.map((traveler) => ({
					person: traveler.person?.id,
					amount: traveler.amount,
				})),
			},
		})
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			alertStore.showAlert({
				type: 'danger',
				title: 'Zuständigkeit konnte nicht ermittelt werden',
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}

const eligibleItems = computed(() => (verdicts.value ?? [])
	.filter((verdict) => verdict.eligible && startable.value.has(verdict.workflow.id))
	.map((verdict) => ({
		preline: `Workflow-ID: ${verdict.workflow.code}`,
		title: verdict.workflow.name,
		...(verdict.workflow.description ? { description: verdict.workflow.description } : {}),
		link: {
			name: 'processes-create-workflow',
			params: { workflow: verdict.workflow.id },
		},
	})) satisfies KernCardNavItems)

const ineligible = computed(() => (verdicts.value ?? [])
	.filter((verdict) => !verdict.eligible))

const claimItems = computed(() => (claimWorkflows.value ?? [])
	.filter((workflow) => startable.value.has(workflow.id))
	.map((workflow) => ({
		preline: `Workflow-ID: ${workflow.code}`,
		title: workflow.name,
		...(workflow.description ? { description: workflow.description } : {}),
		link: {
			name: 'processes-create-workflow',
			params: { workflow: workflow.id },
		},
	})) satisfies KernCardNavItems)

function claimState(permit: NonNullable<typeof permits.value>[number]) {
	if(permit.kind === 'general') return `${permit.claims.length} Erstattung(en)`
	return permit.claims.length > 0 ? 'abgerechnet' : 'offen'
}

const noWorkflowText = 'Für diese Dienstreise steht Ihnen kein passender Workflow zur Verfügung. ' +
	'Die Genehmigung kann in jedem Fall das Studierendenparlament erteilen (§ 3 Abs. 1).'

const organizationItemId = useId()
</script>

<template lang="pug">
h1.kern-heading-large Dienstreisen
p.kern-body
	| Dienstreisen bedürfen der Genehmigung vor Reiseantritt (§ 3 Dienstreiserichtlinie).
	| Die Erstattung ist binnen zwei Wochen nach Reiseende unter Vorlage der Genehmigung und der Belege zu beantragen (§ 4).
ul.kern-list.mb-8
	li
		NuxtLink.kern-link(to="/travel/advances") Überfällige Vorschüsse
	li(v-if="authStore.hasPermission('vehicleDrivers.read').value")
		NuxtLink.kern-link(to="/vehicleDrivers") Fahrberechtigungen für dienstliche Fahrzeuge

h2.kern-heading-medium Dienstreise beantragen
p.kern-body
	| Welche Stelle die Dienstreise genehmigen kann, hängt von den Reisenden, dem Anlass und den Kosten ab.
	| Mit den folgenden Angaben werden die zuständigen Stellen ermittelt.
TravelSelectInput(
	v-model="facts.kind"
	label="Art der Genehmigung"
	:options="kindOptions"
)
TravelCheckboxInput(
	v-model="facts.domestic"
	label="Die Dienstreise ist auf das Inland beschränkt"
)
TravelDateInput(
	v-model="facts.startDate"
	:label="facts.kind === 'general' ? 'Gültig ab' : 'Beginn der Reise'"
)
TravelSelectInput(
	v-model="facts.occasion"
	label="Anlass"
	:options="occasionOptions"
)
TravelSelectInput(
	v-model="facts.travelerBasis"
	label="Personenkreis"
	:options="travelerBasisOptions"
)
TravelSelectInput(
	v-model="facts.specialInterest"
	label="Besonderes Interesse der Studierendenschaft"
	:options="specialInterestOptions"
)
TravelSelectInput(
	v-model="facts.car"
	label="Kraftfahrzeug"
	:options="carOptions"
)
KernCurrencyInput(
	v-if="facts.car === 'carsharing'"
	v-model="facts.carsharingEstimate"
	label="Geschätzte Carsharing-Kosten"
)
.kern-form-input
	label.kern-label(:for="organizationItemId") Antrag für eine Organisationseinheit (optional)
	OrganizationItemSelect(
		:id="organizationItemId"
		v-model="facts.initiatorOrganizationItem"
		label-null="Keine, ich beantrage für mich selbst"
	)
TravelPermitTravelersInput(
	v-model="facts.travelers"
	:carsharing="facts.car === 'carsharing'"
	:share="share"
)
button.kern-btn.kern-btn--primary.mt-4(
	type="button"
	:disabled="!factsComplete"
	@click="findWorkflows"
)
	span.kern-icon.kern-icon--search(aria-hidden="true")
	span.kern-label Zuständige Stellen ermitteln
template(v-if="verdicts")
	h3.kern-heading-small.mt-8 Zuständige Stellen
	KernCardNav(
		v-if="eligibleItems.length > 0"
		:items="eligibleItems"
	)
	KernAlert(
		v-else
		type="warning"
		:dismissible="false"
		title="Keine zuständige Stelle gefunden"
		:text="noWorkflowText"
	)
	details.mt-4(v-if="ineligible.length > 0")
		summary.kern-body Nicht zuständige Stellen anzeigen
		ul.kern-list
			li(
				v-for="verdict of ineligible"
				:key="verdict.workflow.id"
			) {{ verdict.workflow.name }}: {{ verdict.reasons.join(', ') }}

h2.kern-heading-medium.mt-8 Erstattung beantragen
KernCardNav(
	v-if="claimItems.length > 0"
	:items="claimItems"
)
p.kern-body(v-else) Ihnen steht kein Workflow für die Erstattung von Reisekosten zur Verfügung.

h2.kern-heading-medium.mt-8 Genehmigungen
KernTable(
	caption="Dienstreisegenehmigungen"
	:columns="[ 'title', 'period', 'travelers', 'claims' ]"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:data="permits ?? []"
)
	template(#title-header)
		| Dienstgeschäft
	template(#title-body="{ item }")
		NuxtLink.kern-link(:to="`/travel/${item.id}`") {{ item.title }}
		br
		span.kern-body--small {{ item.destination }} · {{ formatTravelPermitKind(item.kind) }}
	template(#period-header)
		| Zeitraum
	template(#period-body="{ item }")
		| {{ formatBudgetPlan(item) }}
	template(#travelers-header)
		| Reisende
	template(#travelers-body="{ item }")
		| {{ item.travelers.map((traveler) => formatPerson(traveler.person)).join(', ') }}
	template(#claims-header)
		| Erstattung
	template(#claims-body="{ item }")
		| {{ claimState(item) }}
</template>
