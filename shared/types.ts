export type DestructureArray<T> = T extends (infer U)[] ? U : never

export interface UserInfo {
	person?: Awaited<ReturnType<ReturnType<typeof useDatabase>['query']['persons']['findFirst']>>
	memberships?: Awaited<ReturnType<typeof getEffectiveMemberships>>
	roles: Awaited<ReturnType<typeof getPersonRoles>>
	permissions: Awaited<ReturnType<typeof getRolePermissions>>
}
