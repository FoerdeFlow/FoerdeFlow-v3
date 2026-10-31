interface BudgetPlanProcessMutation {
	id?: string
	budget: {
		name: string
		code: string
	} | null
	startDate: string
	endDate: string
	items: {
		title: string
		description: string | null
		revenues?: number | null
		expenses?: number | null
		ord: number | null
	}[]
}

interface BudgetPlanItemsProcessMutation {
	id?: string
	title: string
	budget: {
		name: string
		code: string
	} | null
	plan: {
		id: string
		startDate: string
		endDate: string
		budget: {
			name: string
			code: string
		} | null
	}
	items: {
		id?: string | null
		ord: number | null
		title: string
		description: string | null
		revenues?: number | null
		expenses?: number | null
	}[]
	/** The titles as they stood when the change was applied for. */
	previous: {
		startDate: string
		endDate: string
		items: {
			id: string
			ord: number | null
			title: string
			description: string | null
			revenues?: number | null
			expenses?: number | null
		}[]
	}
}

interface ExpenseAuthorizationProcessMutation {
	id?: string
	budgetPlanItem: {
		title: string
		/** Whether the title itself is still being applied for. */
		pending?: boolean
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

interface TravelCoded {
	code: string
	name: string
}

interface TravelPerson {
	firstName: string
	lastName: string
	callName: string | null
	pronouns: string | null
}

/**
 * A permit for an official journey, either as a process carries it or as it
 * is read from the database for an advance or a claim referring to it.
 */
interface TravelPermitProcessMutation {
	id?: string
	traveler: TravelPerson | null
	role: (TravelCoded & {
		organizationItem: {
			id: string
			name: string
		}
	}) | null
	specialAllocation: TravelCoded | null
	title: string
	description: string | null
	origin: string
	destination: string
	startDate: string
	endDate: string
	transportMode: TravelCoded | null
	transportReason: TravelCoded | null
	type: 'planned' | 'reserve'
	budgetPlanItem: {
		ord: number | null
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
	amount: number
	items: {
		id?: string
		ord: number
		costType: TravelCoded | null
		description: string | null
		amount: number
	}[]
}

interface TravelAdvanceProcessMutation {
	id?: string
	permit: TravelPermitProcessMutation | null
	amount: number
}

interface TravelClaimProcessMutation {
	id?: string
	permit: TravelPermitProcessMutation | null
	requestedAmount: number
	amount: number
	payoutAmount: number
	items: {
		ord: number
		permitItem: string
		description: string | null
		amount: number
	}[]
}

export interface ExpandedProcessMutations {
	budgetPlan: BudgetPlanProcessMutation
	budgetPlanItem: BudgetPlanItemsProcessMutation
	expenseAuthorization: ExpenseAuthorizationProcessMutation
	paymentOrder: PaymentOrderProcessMutation
	longtermContract: LongtermContractProcessMutation
	representationAllowance: RepresentationAllowanceProcessMutation
	travelPermit: TravelPermitProcessMutation
	travelAdvance: TravelAdvanceProcessMutation
	travelClaim: TravelClaimProcessMutation
}

export type ProcessMutation = keyof ExpandedProcessMutations
