export type DestructureArray<T> = T extends (infer U)[] ? U : never

export interface UserInfo {
	person?: NonNullable<
		Awaited<ReturnType<ReturnType<typeof useDatabase>['query']['persons']['findFirst']>>
	> & { displayName: string }
	memberships?: Awaited<ReturnType<typeof getEffectiveMemberships>>
	roles: Awaited<ReturnType<typeof getPersonRoles>>
	permissions: Awaited<ReturnType<typeof getRolePermissions>>
}
