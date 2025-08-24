export type DestructureArray<T> = T extends (infer U)[] ? U : never
