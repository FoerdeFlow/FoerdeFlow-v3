<script setup lang="ts">
import type { NuxtLinkProps } from '#app'
import type { Scope } from '~/types'

const props = defineProps<{
	items: {
		preline?: string
		title: string
		subline?: string
		description?: string
		link: NuxtLinkProps['to']
		linkTarget?: '_blank'
		linkLabel: string
		permission?: string
	}[]
	scope?: Scope
}>()

const authStore = useAuthStore()
</script>

<template lang="pug">
.kern-container
	.kern-row
		template(
			v-for="(item, idx) of props.items"
			:key="idx"
		)
			.kern-col-12.kern-col-lg-6(
				v-if="!item.permission || authStore.hasPermission(item.permission, props.scope || {}).value"
			)
				article.kern-card
					.kern-card__container
						header.kern-card__header
							p.kern-preline(v-if="item.preline") {{ item.preline }}
							h2.kern-title {{ item.title }}
							h3.kern-subline(v-if="item.subline") {{ item.subline }}
						section.kern-card__body(v-if="item.description")
							KernText(:text="item.description")
						footer.kern-card__footer
							NuxtLink.kern-btn.kern-btn--primary(
								:to="item.link"
								:target="item.linkTarget"
							)
								span.kern-label {{ item.linkLabel }}
</template>
