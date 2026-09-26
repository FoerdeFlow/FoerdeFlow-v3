export type DestructureArray<T> = T extends (infer U)[] ? U : never

export interface UserInfo {
	person?: NonNullable<
		Awaited<ReturnType<ReturnType<typeof useDatabase>['query']['persons']['findFirst']>>
	> & { displayName: string }
	memberships?: Awaited<ReturnType<typeof getEffectiveMemberships>>
	roles: Awaited<ReturnType<typeof getPersonRoles>>
	permissions: Awaited<ReturnType<typeof getRolePermissions>>
	/*
	 * Gesetzt, solange eine fremde Identität angenommen ist, und verweist dann
	 * auf die echte, angemeldete Person. Das Feld dient allein der Anzeige: Die
	 * Rechte in diesem Objekt stammen ausschließlich von der angenommenen
	 * Identität.
	 */
	impersonator?: {
		id: string
		displayName: string
	}
}
