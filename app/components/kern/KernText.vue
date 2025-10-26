<script setup lang="ts">
const props = defineProps<{
	text: string
	size?: 'small' | 'normal'
	muted?: boolean
}>()

const text = computed(() => ({
	paragraphs: props.text.split('\n\n').map((paragraph) => ({
		lines: paragraph.split('\n').map((line) => {
			const actions = [
				...line.matchAll(/\*(?!\*)|\*\*|_/g),
				{ 0: '', index: line.length },
			]
			const modifiers = { bold: false, italic: false }
			const sections = []
			let oldIndex = 0
			for(const action of actions) {
				const key = ({
					'*': 'italic',
					_: 'italic',
					'**': 'bold',
				} as Record<string, keyof typeof modifiers>)[action[0]]
				sections.push({
					text: line.slice(oldIndex, action.index),
					modifiers: { ...modifiers },
				})
				if(key) {
					modifiers[key] = !modifiers[key]
				}
				oldIndex = action.index + action[0].length
			}
			return sections
		}),
	})),
}))
</script>

<template lang="pug">
p.mb-2.kern-body(
	v-for="(paragraph, idx) in text.paragraphs"
	:key="idx"
	:class=`{
		'kern-body--small': props.size === 'small',
		'kern-body--muted': props.muted,
	}`
)
	template(
		v-for="(line, lineIdx) in paragraph.lines"
		:key="lineIdx"
	)
		template(v-if="lineIdx > 0")
			br
		template(
			v-for="(section, sectionIdx) in line"
			:key="sectionIdx"
		)
			span(
				:class="{ 'kern-body--bold': section.modifiers.bold, 'italic': section.modifiers.italic }"
			)
				| {{ section.text }}
</template>
