<script setup lang="ts">
const props = defineProps<{
	items: {
		title?: string
		tasks: {
			id: string
			label: string
			status: 'done' | 'partial' | 'open' | 'blocked'
		}[]
	}[]
}>()

const emit = defineEmits<{
	select: [ taskId: string ]
}>()

type InferT<T> = T extends (infer U)[] ? U : never
const items = computed(() => {
	const result = []
	let number = 1
	for(const item of props.items) {
		const resultItem = {
			title: item.title,
			tasks: [] as ({ number: number } & InferT<typeof item.tasks>)[],
		}
		for(const task of item.tasks) {
			resultItem.tasks.push({ number, ...task })
			number++
		}
		result.push(resultItem)
	}
	return result
})
</script>

<template lang="pug">
.kern-task-list.w-full
	template(
		v-for="(item, idx) of items"
		:key="idx"
	)
		.kern-task-list__header(
			v-if="item.title"
		)
			h2.kern-title.kern-title--medium {{ item.title }}
		ul.kern-task-list__list
			li.kern-task-list__item(
				v-for="(task, subidx) of item.tasks"
				:key="subidx"
			)
				span.kern-number {{ task.number }}
				.kern-task-list__title(
					:id="`task${task.number}-title`"
				)
					a.kern-link.kern-link--stretched(
						v-if="[ 'done', 'partial', 'open' ].includes(task.status)"
						href="#"
						:aria-describedby="`task${task.number}-status`"
						@click.prevent="() => emit('select', task.id)"
					) {{ task.label }}
					p.kern-body(
						v-else
						:aria-describedby="`task${task.number}-status`"
					) {{ task.label }}
					.kern-task-list__status(
						:id="`task${task.number}-status`"
					)
						span.kern-badge.kern-badge--success(v-if="task.status === 'done'")
							span.kern-icon.kern-icon--success.kern-icon--sm(aria-hidden="true")
							span.kern-label.kern-label--small Erledigt
						span.kern-badge.kern-badge--warning(v-if="task.status === 'partial'")
							span.kern-label.kern-label--small Unvollständig
						span.kern-badge.kern-badge--info(v-if="task.status === 'blocked'")
							span.kern-label.kern-label--small Noch nicht zu bearbeiten
</template>
