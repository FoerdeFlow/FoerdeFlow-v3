<script setup lang="ts">
const authStore = useAuthStore()
authStore.requireLogin()

const { data } = useFetch('/api/travelPermits/overdueAdvances')
</script>

<template lang="pug">
h1.kern-heading-large Überfällige Vorschüsse
p.kern-body
	| Zu diesen Dienstreisen wurde ein Vorschuss gewährt, aber innerhalb der Frist des § 4 keine Erstattung beantragt.
	| Der Vorschuss ist zurückzufordern (§ 9).
KernTable(
	caption="Vorschüsse ohne Erstattungsantrag"
	:columns="[ 'title', 'travelers', 'deadline', { name: 'amount', width: '12em', class: 'numeric' } ]"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:data="data ?? []"
)
	template(#title-header)
		| Dienstgeschäft
	template(#title-body="{ item }")
		NuxtLink.kern-link(:to="`/travel/${item.id}`") {{ item.title }}
		br
		span.kern-body--small {{ formatBudgetPlan(item) }}
	template(#travelers-header)
		| Reisende
	template(#travelers-body="{ item }")
		| {{ item.travelers.map((traveler) => formatPerson(traveler.person)).join(', ') }}
	template(#deadline-header)
		| Frist abgelaufen am
	template(#deadline-body="{ item }")
		| {{ formatDate(item.deadline) }}
	template(#amount-header)
		| Vorschuss
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.advanceAmount) }}
</template>
