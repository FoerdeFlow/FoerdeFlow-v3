interface Person {
	firstName: string
	lastName: string
}

export function sortPerson(a: Person, b: Person) {
	if(a.lastName === b.lastName) {
		return a.firstName.localeCompare(b.firstName)
	}
	return a.lastName.localeCompare(b.lastName)
}
