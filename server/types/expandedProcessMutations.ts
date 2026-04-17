interface ExpenseAuthorizationProcessMutation {
	id?: string
	budgetPlanItem: {
		title: string
		plan: {
			budget: {
				name: string
				code: string
			}
			startDate: string
			endDate: string
		}
	}
	title: string
	description: string | null
	items: {
		title: string
		description: string | null
		amount: number
		ord: number | null
	}[]
}

export interface ExpandedProcessMutations {
	expenseAuthorization: ExpenseAuthorizationProcessMutation
}

export type ProcessMutation = keyof ExpandedProcessMutations
