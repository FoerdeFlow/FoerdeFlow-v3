export function titleEncodeRepresentationAllowance(entry: {
	title: string
}) {
	// A representation allowance is granted by an organizational item rather than
	// paid out of a budget, so there is no code to lead its title.
	return entry.title
}
