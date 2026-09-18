<script setup lang="ts">
import type { SettingsEditor } from '#components'

const authStore = useAuthStore()

/*
 * Die Seite ist reine Verwaltung und bleibt ohne Leseberechtigung gesperrt.
 *
 * Die Prüfung steht bewusst in der Vorlage und nicht als `createError` im
 * Setup: der Auth-Store lädt `userInfo` per `useFetch` ohne `await`, sodass die
 * Berechtigungen beim Ausführen des Setups noch nicht vorliegen und ein
 * synchroner Abbruch auch Berechtigte aussperren würde.
 *
 * Das ist eine Sperre der Oberfläche, keine Zugriffskontrolle für die Daten:
 * `GET /api/settings` bleibt offen, weil Impressum sowie Datenschutz- und
 * Barrierefreiheitserklärung die Angaben ohne Anmeldung brauchen. Geschützt
 * ist das Schreiben, das serverseitig `settings.update` verlangt.
 */
const mayRead = authStore.hasPermission('settings.read')
const mayUpdate = authStore.hasPermission('settings.update')

const { missing, refresh } = useSettings()

const editor = useTemplateRef<typeof SettingsEditor>('editor')

function edit() {
	if(!editor.value) return
	editor.value.edit()
}

const areas = computed(() => [
	{
		title: 'Impressum',
		description: 'Pflichtangaben nach § 5 Digitale-Dienste-Gesetz.',
		link: '/impressum',
		missing: missing.value.imprint,
	},
	{
		title: 'Datenschutzerklärung',
		description: 'Informationspflichten nach Artikel 13 DSGVO.',
		link: '/datenschutz',
		missing: missing.value.privacy,
	},
	{
		title: 'Erklärung zur Barrierefreiheit',
		description: 'Pflichtangaben nach § 12b BITV 2.0.',
		link: '/barrierefreiheit',
		missing: missing.value.accessibility,
	},
])
</script>

<template lang="pug">
h1.kern-heading-large Einstellungen
template(v-if="mayRead")
	p.kern-body
		| Diese Angaben hängen an der betreibenden Körperschaft und erscheinen im
		| Impressum sowie in der Datenschutz- und Barrierefreiheitserklärung.
		| Nicht gepflegte Angaben werden dort als „noch zu ergänzen“ ausgewiesen.
	button.kern-btn.kern-btn--primary(
		v-if="mayUpdate"
		type="button"
		@click="edit()"
	)
		span.kern-icon.kern-icon--edit(aria-hidden="true")
		span.kern-label Bearbeiten
	ul.ff3-settings__list
		li(
			v-for="area of areas"
			:key="area.link"
		)
			article.kern-card.kern-card--interactive
				.kern-card__container
					header.kern-card__header
						hgroup.kern-hgroup
							h2.kern-title
								NuxtLink.kern-link--stretched(:to="area.link") {{ area.title }}
							p.kern-preline
								span.kern-badge.kern-badge--small(
									:class="area.missing > 0 ? 'kern-badge--warning' : 'kern-badge--success'"
								)
									span.kern-label.kern-label--small
										template(v-if="area.missing > 0")
											| {{ area.missing }} fehlen noch
										template(v-else)
											| vollständig
					section.kern-card__body
						p.kern-body.kern-body--small {{ area.description }}
	SettingsEditor(
		ref="editor"
		@refresh="refresh"
	)
KernAlert(
	v-else
	type="danger"
	title="Keine Berechtigung"
	text="Für die Einstellungen fehlt Ihnen die Berechtigung „Einstellungen lesen“. Wenden Sie sich an eine Person mit Administratorrechten."
	:dismissible="false"
)
</template>

<style scoped>
.ff3-settings__list {
	display: grid;
	gap: var(--kern-metric-space-default);
	margin: var(--kern-metric-space-large) 0 0 0;
	padding: 0;
	list-style: none;
}

@media (min-width: 48rem) {
	.ff3-settings__list {
		grid-template-columns: 1fr 1fr 1fr;
	}
}
</style>
