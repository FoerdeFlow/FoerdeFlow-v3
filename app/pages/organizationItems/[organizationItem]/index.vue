<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('organizationItems-organizationItem')

const { data } = useFetch(() => `/api/organizationItems/${route.params.organizationItem}`, {
	default: () => ({
		code: '',
		name: '',
		description: '',
		parent: null,
		children: [],
	}),
})

const subPages: KernCardNavItems = [
	{
		title: 'Mitglieder',
		link: {
			name: 'organizationItems-organizationItem-members',
			params: { organizationItem: route.params.organizationItem },
		},
		linkLabel: 'Mitglieder anzeigen',
	},
	{
		title: 'Gruppen',
		description: 'Übersicht über die Gruppen',
		link: {
			name: 'organizationItems-organizationItem-groups',
			params: { organizationItem: route.params.organizationItem },
		},
		linkLabel: 'Gruppen anzeigen',
	},
	{
		title: 'Sitzungen',
		description: 'Übersicht über die Sitzungen',
		link: {
			name: 'organizationItems-organizationItem-sessions',
			params: { organizationItem: route.params.organizationItem },
		},
		linkLabel: 'Sitzungen anzeigen',
	},
]
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'organizationItems' }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Übersicht
header
	p.kern-preline Organisationseinheit
	h1.kern-heading-large {{ data.name }} ({{ data.code }})
.mb-8
	KernText(:text="data.description")
.kern-container
	.kern-row
		.kern-col(v-if="data.parent")
			article.kern-card
				.kern-card__container
					.kern-card__header
						p.kern-preline Übergeordnete Organisationseinheit
						h2.kern-title {{ data.parent.name }} ({{ data.parent.code }})
		.kern-col(v-if="data.children.length > 0")
			article.kern-card
				.kern-card__container
					.kern-card__header
						h2.kern-title Untergeordnete Organisationseinheiten
					.kern-card__body
						ul
							li(
								v-for="item of data.children"
								:key="item.id"
							)
								| {{ item.name }} ({{ item.code }})
KernCardNav(:items="subPages")
</template>
