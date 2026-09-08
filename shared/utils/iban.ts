/**
 * The length an IBAN has in each country that issues one, taken from the
 * ISO 13616 registry.
 *
 * Written as a list of country code and length so that the table stays
 * readable at a glance. A country that is not listed is only checked against
 * the generic rules, so that an IBAN of a newly registered country is not
 * rejected outright.
 */
const ibanLengths = new Map(
	[
		'AD24 AE23 AL28 AT20 AZ28 BA20 BE16 BG22 BH22 BI27 BR29 BY28',
		'CH21 CR22 CY28 CZ24 DE22 DJ27 DK18 DO28 EE20 EG29 ES24 FI18',
		'FO18 FR27 GB22 GE22 GI23 GL18 GR27 GT28 HR21 HU28 IE22 IL23',
		'IQ23 IS26 IT27 JO30 KW30 KZ20 LB28 LC32 LI21 LT20 LU20 LV21',
		'LY25 MC27 MD24 ME22 MK19 MN20 MR27 MT31 MU30 NI28 NL18 NO15',
		'OM23 PK24 PL28 PS29 PT25 QA29 RO24 RS22 RU33 SA24 SC31 SD18',
		'SE24 SI19 SK24 SM27 SO23 ST25 SV28 TL23 TN24 TR26 UA29 VA22',
		'VG24 XK20',
	]
		.flatMap((row) => row.split(' '))
		.map((entry): [ string, number ] => [ entry.slice(0, 2), Number(entry.slice(2)) ]),
)

/** The number of characters an IBAN is grouped by when it is written out. */
const ibanGroupSize = 4

/**
 * Strips the formatting from an IBAN, so that it can be stored, compared and
 * checked regardless of how it was written down.
 *
 * @param value - The IBAN as it was entered
 * @returns The IBAN without spaces and in upper case
 */
export function normalizeIban(value: string | null): string {
	return (value ?? '').replaceAll(/\s/g, '').toUpperCase()
}

/**
 * Formats an IBAN the way it is written on paper: in groups of four,
 * separated by spaces.
 *
 * @param value - The IBAN in any notation
 * @returns The grouped IBAN, empty if there is nothing to format
 */
export function formatIban(value: string | null): string {
	const normalized = normalizeIban(value)
	return normalized.match(new RegExp(`.{1,${ibanGroupSize}}`, 'g'))?.join(' ') ?? ''
}

/**
 * Computes the ISO 7064 MOD 97-10 remainder of an IBAN.
 *
 * The check digits of an IBAN are chosen so that this remainder is 1, which is
 * what makes a typo in any other position show up.
 *
 * @param iban - The normalized IBAN
 * @returns The remainder of the IBAN divided by 97
 */
function ibanRemainder(iban: string): number {
	// The country code and the check digits move to the end, then every letter
	// is replaced by its position in the alphabet plus nine.
	const rearranged = iban.slice(ibanGroupSize) + iban.slice(0, ibanGroupSize)

	// The number is far too large for a JavaScript number, so it is divided one
	// digit at a time.
	let remainder = 0
	for(const character of rearranged) {
		const digits = character >= 'A' && character <= 'Z'
			? ((character.codePointAt(0) ?? 0) - 55).toString()
			: character

		for(const digit of digits) {
			remainder = (remainder * 10 + Number(digit)) % 97
		}
	}

	return remainder
}

/**
 * Checks whether a value is an IBAN, meaning that it is built correctly, has
 * the length its country uses and matches its own check digits.
 *
 * @param value - The IBAN in any notation
 * @returns Whether the IBAN can be used
 */
export function isValidIban(value: string | null): boolean {
	const iban = normalizeIban(value)

	if(!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
		return false
	}
	// The shortest IBAN in use has 15 characters, the standard allows 34.
	if(iban.length < 15 || iban.length > 34) {
		return false
	}

	const expectedLength = ibanLengths.get(iban.slice(0, 2))
	if(expectedLength !== undefined && iban.length !== expectedLength) {
		return false
	}

	return ibanRemainder(iban) === 1
}
