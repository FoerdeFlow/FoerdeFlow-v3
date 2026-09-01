export function metaAmount(meta: unknown, key: string): number | null {
	if(typeof meta !== 'object' || meta === null || !(key in meta)) {
		return null
	}

	const value = (meta as Record<string, unknown>)[key]
	return typeof value === 'number' && value > 0 ? value : null
}
