<script setup lang="ts">
import type { NuxtLinkProps } from '#app'

const props = defineProps<{
	items: {
		preline?: string
		title: string
		subline?: string
		description?: string
		link: NuxtLinkProps['to']
		linkTarget?: '_blank'
		linkLabel: string
	}[]
}>()
</script>

<template lang="pug">
.kern-container
	.kern-row
		.kern-col-12.kern-col-lg-6(
			v-for="(item, idx) of props.items"
			:key="idx"
		)
			article.kern-card
				.kern-card__container
					header.kern-card__header
						p.kern-preline(v-if="item.preline") {{ item.preline }}
						h2.kern-title {{ item.title }}
						h3.kern-subline(v-if="item.subline") {{ item.subline }}
					section.kern-card__body(v-if="item.description")
						p.kern-body {{ item.description }}
					footer.kern-card__footer
						NuxtLink.kern-btn.kern-btn--primary(
							:to="item.link"
							:target="item.linkTarget"
						)
							span.kern-label {{ item.linkLabel }}
</template>
