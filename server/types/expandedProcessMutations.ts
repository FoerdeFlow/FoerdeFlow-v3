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
	} | null
	budget: {
		name: string
		code: string
	} | null
	title: string
	description: string | null
	items: {
		title: string
		description: string | null
		amount: number
		ord: number | null
	}[]
}

interface LongtermContractProcessMutation {
	id?: string
	budget: {
		name: string
		code: string
	} | null
	title: string
	description: string | null
	startDate: string
	endDate: string | null
	items: {
		ord: number | null
		type: 'time' | 'usage' | 'fixed'
		title: string
		description: string | null
		amount: number
		timeUnit: 'month' | 'quarter' | 'semester' | 'year' | null
		usageUnit: string | null
		expectedUsage: number | null
	}[]
}

interface RepresentationAllowanceProcessMutation {
	id?: string
	organizationItem: {
		name: string
		code: string
	} | null
	title: string
	description: string | null
	periodUnit: 'month' | 'once'
	startDate: string
	endDate: string | null
	recipients: {
		ord: number | null
		amount: number
		person: {
			firstName: string
			lastName: string
			callName: string | null
			pronouns: string | null
		} | null
	}[]
}

export interface ExpandedProcessMutations {
	expenseAuthorization: ExpenseAuthorizationProcessMutation
	longtermContract: LongtermContractProcessMutation
	representationAllowance: RepresentationAllowanceProcessMutation
}

export type ProcessMutation = keyof ExpandedProcessMutations
