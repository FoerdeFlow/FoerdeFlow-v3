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
			/** Whether the plan is still being applied for. */
			pending?: boolean
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

interface PaymentOrderProcessMutation {
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
	expenseAuthorization: {
		title: string
		amount: number
	} | null
	recipientType: 'reimbursement' | 'invoice'
	recipientPerson: {
		firstName: string
		lastName: string
		callName: string | null
		pronouns: string | null
		iban: string | null
	} | null
	recipientName: string | null
	recipientIban: string | null
	purpose: string | null
	title: string
	description: string | null
	amount: number
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
	paymentOrder: PaymentOrderProcessMutation
	longtermContract: LongtermContractProcessMutation
	representationAllowance: RepresentationAllowanceProcessMutation
}

export type ProcessMutation = keyof ExpandedProcessMutations
