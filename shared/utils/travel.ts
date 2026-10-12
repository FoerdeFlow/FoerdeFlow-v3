/**
 * The rules of the travel regulation (Dienstreiserichtlinie) that the server
 * enforces and the forms show before anything is sent.
 *
 * What a workflow allows is kept in the meta data of its mutation: each body
 * that may grant a permit gets a workflow of its own, and the meta data says up
 * to which amount, for whom and whether abroad.
 */

export type TravelPermitKind = 'single' | 'general'

export type TravelPermitOccasion = 'parliamentSession' | 'other'

export type TravelPermitTravelerBasis =
	| 'officeHolder'
	| 'employee'
	| 'commissioned'
	| 'sports'
	| 'recognizedMember'

export type TravelPermitSpecialInterest =
	| 'none'
	| 'campusTravel'
	| 'centralBodySession'
	| 'vehicleCosts'
	| 'parliamentDecision'

export type TravelPermitCar = 'none' | 'private' | 'carsharing'

export type TravelClaimItemCategory =
	| 'publicTransport'
	| 'longDistance'
	| 'seatReservation'
	| 'privateCar'
	| 'parking'
	| 'vehicleExpenses'
	| 'conferenceFee'
	| 'training'

export const travelPermitKinds: TravelPermitKind[] = [ 'single', 'general' ]

export const travelPermitOccasions: TravelPermitOccasion[] = [ 'other', 'parliamentSession' ]

export const travelPermitTravelerBases: TravelPermitTravelerBasis[] = [
	'officeHolder',
	'employee',
	'commissioned',
	'sports',
	'recognizedMember',
]

export const travelPermitSpecialInterests: TravelPermitSpecialInterest[] = [
	'none',
	'campusTravel',
	'centralBodySession',
	'vehicleCosts',
	'parliamentDecision',
]

export const travelPermitCars: TravelPermitCar[] = [ 'none', 'private', 'carsharing' ]

export const travelClaimItemCategories: TravelClaimItemCategory[] = [
	'publicTransport',
	'longDistance',
	'seatReservation',
	'privateCar',
	'parking',
	'vehicleExpenses',
	'conferenceFee',
	'training',
]

/** The categories the limit of § 8 applies to, together per event. */
export const travelClaimEventCategories: TravelClaimItemCategory[] = [ 'conferenceFee', 'training' ]

/**
 * One way a workflow may be eligible for a journey. A workflow lists several of
 * them, and one that holds is enough.
 *
 * - `membershipOf`: every traveller is a member of the organization item, or
 *   of the one the process is started for if it reads `initiator`.
 * - `specialInterest`: a special interest was established, or none was.
 * - `occasion`: the journey leads to that occasion.
 * - `travelerBasis`: the travellers fall under the regulation on that ground.
 */
export type TravelEligibility =
	| { membershipOf: string }
	| { specialInterest: boolean }
	| { occasion: TravelPermitOccasion }
	| { travelerBasis: TravelPermitTravelerBasis }

export interface TravelMeta {
	maximumAmountPerPerson: number | null
	domesticOnly: boolean
	permitKinds: TravelPermitKind[]
	eligibleIf: TravelEligibility[]
	kilometerRate: number
	maximumEventAmountPerPerson: number
	claimDeadlineDays: number
	advanceRatio: number
	advanceMinimumBase: number
}

function metaRecord(meta: unknown): Record<string, unknown> {
	return typeof meta === 'object' && meta !== null && !Array.isArray(meta)
		? meta as Record<string, unknown>
		: {}
}

function metaNumber(record: Record<string, unknown>, key: string, fallback: number) {
	const value = record[key]
	return typeof value === 'number' && value > 0 ? value : fallback
}

function parseEligibility(entry: unknown): TravelEligibility | null {
	const record = metaRecord(entry)
	if(typeof record.membershipOf === 'string') {
		return { membershipOf: record.membershipOf }
	}
	if(typeof record.specialInterest === 'boolean') {
		return { specialInterest: record.specialInterest }
	}
	if(travelPermitOccasions.includes(record.occasion as TravelPermitOccasion)) {
		return { occasion: record.occasion as TravelPermitOccasion }
	}
	if(travelPermitTravelerBases.includes(record.travelerBasis as TravelPermitTravelerBasis)) {
		return { travelerBasis: record.travelerBasis as TravelPermitTravelerBasis }
	}
	return null
}

/**
 * Reads the rules of the travel regulation from the meta data of a mutation.
 * Every rate the regulation fixes is its default, so a workflow only has to
 * name what sets it apart.
 *
 * @param meta - The meta data of the mutation
 * @returns The rules that apply to the mutation
 */
export function travelMeta(meta: unknown): TravelMeta {
	const record = metaRecord(meta)

	const kinds = Array.isArray(record.permitKinds)
		? record.permitKinds.filter((kind): kind is TravelPermitKind =>
			travelPermitKinds.includes(kind as TravelPermitKind))
		: []

	return {
		maximumAmountPerPerson: metaAmount(meta, 'maximumAmountPerPerson'),
		domesticOnly: record.domesticOnly === true,
		permitKinds: kinds.length > 0 ? kinds : [ 'single' ],
		eligibleIf: Array.isArray(record.eligibleIf)
			? record.eligibleIf.map(parseEligibility).filter((entry) => entry !== null)
			: [],
		kilometerRate: metaNumber(record, 'kilometerRate', 0.3),
		maximumEventAmountPerPerson: metaNumber(record, 'maximumEventAmountPerPerson', 100),
		claimDeadlineDays: metaNumber(record, 'claimDeadlineDays', 14),
		advanceRatio: metaNumber(record, 'advanceRatio', 0.8),
		advanceMinimumBase: metaNumber(record, 'advanceMinimumBase', 100),
	}
}

export interface TravelPermitLimitInput {
	kind: TravelPermitKind
	car: TravelPermitCar
	carsharingEstimate: number | null
	advanceAmount: number | null
	travelers: { amount: number }[]
}

/**
 * Works out the costs of a permit the way the limits of the regulation measure
 * them.
 *
 * Car sharing is invoiced to the student body as a whole, so it is not
 * reimbursed to anyone, but it still counts towards the costs of each person:
 * the limits of § 3 apply to the costs of a journey, not to what is paid out.
 *
 * @param permit - The permit, as far as it was filled in
 * @param meta - The meta data of the mutation
 * @returns The costs per person and in total, the largest advance and what
 * exceeds the limits
 */
export function travelPermitLimits(permit: TravelPermitLimitInput, meta: unknown) {
	const rules = travelMeta(meta)
	const carsharing = permit.car === 'carsharing' ? permit.carsharingEstimate ?? 0 : 0
	const share = permit.travelers.length > 0
		? Math.ceil(carsharing * 100 / permit.travelers.length) / 100
		: 0

	const perPerson = permit.travelers.map((traveler) => currencySum(traveler.amount, share))
	const reimbursable = currencySum(...permit.travelers.map((traveler) => traveler.amount))
	const total = currencySum(reimbursable, carsharing)

	const aboveLimit = rules.maximumAmountPerPerson === null
		? []
		: perPerson
			.map((amount, index) => ({ index, amount }))
			.filter((entry) => entry.amount > (rules.maximumAmountPerPerson ?? 0))

	// An advance is paid on what the travellers lay out themselves, so the car
	// sharing the student body pays directly does not count towards it.
	const advanceAllowed = permit.kind === 'single' && reimbursable > rules.advanceMinimumBase
	const maximumAdvance = advanceAllowed
		? Math.floor(reimbursable * rules.advanceRatio * 100) / 100
		: 0
	const advance = permit.advanceAmount ?? 0
	const advanceInvalid = advance > 0 && (!advanceAllowed || advance > maximumAdvance)

	return {
		rules,
		share,
		perPerson,
		reimbursable,
		total,
		aboveLimit,
		advanceAllowed,
		maximumAdvance,
		advanceInvalid,
		violated: aboveLimit.length > 0 || advanceInvalid,
	}
}

/**
 * Works out the amount of a journey by private car (§ 6 Absatz 3).
 *
 * @param kilometers - The length of the route
 * @param rate - The rate per kilometre
 * @returns The amount, rounded to the cent
 */
export function travelKilometerAmount(kilometers: number, rate: number) {
	return Math.round(kilometers * rate * 100) / 100
}

export interface TravelClaimLimitInput {
	traveler: string | null
	category: TravelClaimItemCategory
	amount: number
	event: string | null
}

/**
 * Adds up the costs of a claim the way the limits measure them: per person,
 * and the fees of § 8 per person and event.
 *
 * @param items - The items of the claim
 * @param approved - The costs approved per person, keyed by their id
 * @param meta - The meta data of the mutation
 * @returns The sums and what exceeds the limits
 */
export function travelClaimLimits(
	items: TravelClaimLimitInput[],
	approved: Record<string, number>,
	meta: unknown,
) {
	const rules = travelMeta(meta)

	const perPerson: Record<string, number> = {}
	const perEvent: Record<string, { traveler: string, event: string, amount: number }> = {}
	for(const item of items) {
		if(!item.traveler) continue
		perPerson[item.traveler] = currencySum(perPerson[item.traveler], item.amount)

		if(!travelClaimEventCategories.includes(item.category)) continue
		const event = item.event?.trim() ?? ''
		const key = `${item.traveler}\u0000${event}`
		perEvent[key] = {
			traveler: item.traveler,
			event,
			amount: currencySum(perEvent[key]?.amount, item.amount),
		}
	}

	const total = currencySum(...items.map((item) => item.amount))
	const personsAboveApproval = Object.entries(perPerson)
		.filter(([ person, amount ]) => amount > (approved[person] ?? 0))
		.map(([ person, amount ]) => ({ person, amount, approved: approved[person] ?? 0 }))
	const eventsAboveLimit = Object.values(perEvent)
		.filter((entry) => entry.amount > rules.maximumEventAmountPerPerson)

	return {
		rules,
		total,
		perPerson,
		personsAboveApproval,
		eventsAboveLimit,
		violated: personsAboveApproval.length > 0 || eventsAboveLimit.length > 0,
	}
}

/**
 * Checks whether a category of costs may be claimed under a permit (§ 6).
 *
 * @param category - The category of the item
 * @param permit - What the permit allows
 * @returns Whether the category may be claimed
 */
export function travelClaimCategoryAllowed(
	category: TravelClaimItemCategory,
	permit: {
		longDistance: boolean
		car: TravelPermitCar
		parkingFeesAllowed: boolean
	},
) {
	switch(category) {
		case 'longDistance':
		case 'seatReservation':
			return permit.longDistance
		case 'privateCar':
			return permit.car === 'private'
		case 'parking':
			return permit.car !== 'none' && permit.parkingFeesAllowed
		case 'vehicleExpenses':
			return permit.car === 'carsharing'
		default:
			return true
	}
}

/**
 * Works out the last day a claim may be handed in on (§ 4).
 *
 * @param endDate - The day the journey ended
 * @param days - The period in days
 * @returns The last day of the period
 */
export function travelClaimDeadline(endDate: Date | string, days: number) {
	const deadline = new Date(endDate)
	deadline.setDate(deadline.getDate() + days)
	return deadline
}

/**
 * Checks whether a claim is handed in after the period of § 4. Being late does
 * not bar the claim, it is merely marked.
 *
 * @param endDate - The day the journey ended
 * @param days - The period in days
 * @param now - The day the claim is handed in
 * @returns Whether the claim is late
 */
export function travelClaimLate(endDate: Date | string, days: number, now: Date = new Date()) {
	const deadline = travelClaimDeadline(endDate, days)
	deadline.setHours(23, 59, 59, 999)
	return now > deadline
}

const travelPermitKindLabels: Record<TravelPermitKind, string> = {
	single: 'Einzelgenehmigung',
	general: 'Generelle Genehmigung (§ 3 Abs. 6)',
}

const travelPermitOccasionLabels: Record<TravelPermitOccasion, string> = {
	parliamentSession: 'Sitzung des Studierendenparlaments',
	other: 'Sonstiges Dienstgeschäft',
}

const travelPermitTravelerBasisLabels: Record<TravelPermitTravelerBasis, string> = {
	officeHolder: 'Amts- oder Mandatsträger*in',
	employee: 'Beschäftigte*r der Studierendenschaft',
	commissioned: 'Beauftragte*r der Studierendenschaft',
	sports: 'Teilnehmer*in am Hochschulsport',
	recognizedMember: 'Mitglied der Studierendenschaft (anerkannter Reisezweck)',
}

const travelPermitSpecialInterestLabels: Record<TravelPermitSpecialInterest, string> = {
	none: 'Kein besonderes Interesse',
	campusTravel: 'Fahrt zwischen Campus der HAW Kiel',
	centralBodySession: 'Sitzung eines Gremiums des zentralen Bereichs',
	vehicleCosts: 'Unvorhersehbare Kosten bei Nutzung dienstlicher Kraftfahrzeuge',
	parliamentDecision: 'Feststellung durch das Studierendenparlament',
}

const travelPermitCarLabels: Record<TravelPermitCar, string> = {
	none: 'Kein Kraftfahrzeug',
	private: 'Privates Kraftfahrzeug',
	carsharing: 'Dienstliches Fahrzeug (Carsharing)',
}

const travelClaimItemCategoryLabels: Record<TravelClaimItemCategory, string> = {
	publicTransport: 'Öffentlicher Personennahverkehr',
	longDistance: 'Fernverkehr',
	seatReservation: 'Sitzplatzreservierung',
	privateCar: 'Privates Kraftfahrzeug',
	parking: 'Parkgebühren',
	vehicleExpenses: 'Auslagen für dienstliches Fahrzeug',
	conferenceFee: 'Tagungsgeld',
	training: 'Aus- und Weiterbildung',
}

export function formatTravelPermitKind(kind: TravelPermitKind): string {
	return travelPermitKindLabels[kind]
}

export function formatTravelPermitOccasion(occasion: TravelPermitOccasion): string {
	return travelPermitOccasionLabels[occasion]
}

export function formatTravelPermitTravelerBasis(basis: TravelPermitTravelerBasis): string {
	return travelPermitTravelerBasisLabels[basis]
}

export function formatTravelPermitSpecialInterest(interest: TravelPermitSpecialInterest): string {
	return travelPermitSpecialInterestLabels[interest]
}

export function formatTravelPermitCar(car: TravelPermitCar): string {
	return travelPermitCarLabels[car]
}

export function formatTravelClaimItemCategory(category: TravelClaimItemCategory): string {
	return travelClaimItemCategoryLabels[category]
}
