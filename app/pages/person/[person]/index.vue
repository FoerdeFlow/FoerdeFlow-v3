<script setup lang="ts">
const route = useRoute('person-person')

const { data } = useFetch(() => `/api/persons/${route.params.person}`, {
	default: () => ({
		firstName: '',
		lastName: '',
		callName: null,
		pronouns: null,
		course: null,
		hasPhoto: false,
	}),
})

const { data: memberships } = useFetch(
	() => `/api/persons/${route.params.person}/memberships`,
	{ default: () => [] },
)

/*
 * Eine Mitgliedschaft gilt als beendet, sobald ihr Enddatum verstrichen ist.
 * Alles andere zählt als aktuell, auch eine Mitgliedschaft, die erst in der
 * Zukunft beginnt, denn sie steht der Person noch bevor.
 */
const currentMemberships = computed(() => memberships.value.filter((membership) =>
	!membership.endDate || new Date(membership.endDate) >= new Date()))
const pastMemberships = computed(() => memberships.value.filter((membership) =>
	membership.endDate && new Date(membership.endDate) < new Date()))

const details = computed(() => [
	// Der Rufname steht in der Überschrift, der amtliche Vorname also nur, wenn
	// er davon abweicht.
	...data.value.callName
		? [ { key: 'Amtlicher Name', value: `${data.value.firstName} ${data.value.lastName}` } ]
		: [],
	{
		key: 'Pronomen',
		value: data.value.pronouns ?? '–',
	},
	{
		key: 'Studiengang',
		value: formatCourse(data.value.course) || '–',
	},
	{
		key: 'Fachschaft',
		value: formatCouncil(data.value.course?.council ?? null) || '–',
	},
	{
		key: 'Fachbereich',
		value: formatDepartment(data.value.course?.department ?? null) || '–',
	},
])
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'person' }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Übersicht
header
	p.kern-preline Person
	h1.kern-heading-large {{ formatPerson(data) }}
.ff3-person
	img.ff3-person__photo(
		v-if="data.hasPhoto"
		:src="`/api/persons/${route.params.person}/photo`"
		:alt="`Lichtbild von ${formatPerson(data)}`"
	)
	dl.kern-description-list.ff3-person__details
		.kern-description-list-item(
			v-for="item of details"
			:key="item.key"
		)
			dt.kern-description-list-item__key {{ item.key }}
			dd.kern-description-list-item__value {{ item.value }}
section.mt-8
	h2.kern-title Aktuelle Gremienmitgliedschaften
	MembershipTable(
		caption="Liste der aktuellen Gremienmitgliedschaften"
		:memberships="currentMemberships"
	)
section.mt-8
	h2.kern-title Frühere Gremienmitgliedschaften
	MembershipTable(
		caption="Liste der früheren Gremienmitgliedschaften"
		:memberships="pastMemberships"
	)
p.mt-4.kern-body.kern-body--small.kern-body--muted
	| Aufgeführt sind nur Mitgliedschaften in Organisationseinheiten, für die Sie die
	| Berechtigung zum Lesen der Mitglieder besitzen.
</template>

<style scoped>
.ff3-person {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-start;
	gap: var(--kern-metric-space-default);
	margin-bottom: var(--kern-metric-space-default);
}

.ff3-person__photo {
	width: 10rem;
	border: var(--kern-metric-border-width-default) solid var(--kern-color-layout-border);
	border-radius: var(--kern-metric-border-radius-default);
}

.ff3-person__details {
	flex: 1 1 20rem;
}
</style>
