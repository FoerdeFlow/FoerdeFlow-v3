import { eq } from 'drizzle-orm'

/**
 * Writes anew the means of transport a reason is given for and the roles it is
 * restricted to. Both are sets without an identity of their own, so the rows
 * are replaced instead of being matched one by one.
 *
 * @param tx - The transaction the reason is written in
 * @param reason - The reason whose links are meant
 * @param links - The ids of the means of transport and of the roles, a list
 * that is left out stays as it is
 */
export async function writeTravelTransportReasonLinks(
	tx: ReturnType<typeof useDatabase>,
	reason: string,
	links: { transportModes?: string[], roles?: string[] },
) {
	if(links.transportModes) {
		await tx
			.delete(travelTransportReasonModes)
			.where(eq(travelTransportReasonModes.reason, reason))
		await tx.insert(travelTransportReasonModes).values([ ...new Set(links.transportModes) ]
			.map((transportMode) => ({ reason, transportMode })))
	}

	if(links.roles) {
		await tx
			.delete(travelTransportReasonRoles)
			.where(eq(travelTransportReasonRoles.reason, reason))
		const rows = [ ...new Set(links.roles) ].map((role) => ({ reason, role }))
		if(rows.length > 0) await tx.insert(travelTransportReasonRoles).values(rows)
	}
}

const codedColumns = {
	id: true,
	code: true,
	name: true,
} as const

/** How the means of transport and the roles of a reason are read along with it. */
export const travelTransportReasonLinksWith = {
	transportModes: {
		with: {
			transportMode: {
				columns: {
					...codedColumns,
					reasonRequired: true,
				},
			},
		},
		columns: {},
	},
	roles: {
		with: {
			role: {
				columns: codedColumns,
			},
		},
		columns: {},
	},
} as const

/**
 * Flattens the links of a reason as they are read with
 * {@link travelTransportReasonLinksWith}.
 *
 * @param reason - The reason with its rows of links
 * @returns The reason with the means of transport and the roles themselves
 */
export function withTravelTransportReasonLinks<T extends {
	transportModes: { transportMode: unknown }[]
	roles: { role: unknown }[]
}>(reason: T): Omit<T, 'transportModes' | 'roles'> & {
	transportModes: T['transportModes'][number]['transportMode'][]
	roles: T['roles'][number]['role'][]
} {
	return {
		...reason,
		transportModes: reason.transportModes
			.map((entry) => entry.transportMode as T['transportModes'][number]['transportMode']),
		roles: reason.roles.map((entry) => entry.role as T['roles'][number]['role']),
	}
}
