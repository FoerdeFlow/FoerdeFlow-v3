export function serializeDate(date: Date | null): string | null {
	if(!date) return null
	return [
		date.getFullYear(),
		(date.getMonth() + 1).toString().padStart(2, '0'),
		date.getDate().toString().padStart(2, '0'),
	].join('-')
}
