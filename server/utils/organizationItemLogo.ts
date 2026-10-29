import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

/** The largest logo an organization item may upload. */
export const organizationItemLogoMaxSize = 2 * 1024 * 1024

/** The signature every PNG file starts with. */
const pngSignature = Buffer.from([ 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A ])

/**
 * Builds the path the logo of an organization item is stored at.
 *
 * @param organizationItem - The organization item the logo belongs to
 * @returns The path of the file
 */
export function organizationItemLogoPath(organizationItem: string) {
	return `./data/organizationItemLogo_${organizationItem}.png`
}

/**
 * Checks whether a file is a PNG image by its signature.
 *
 * @param data - The content of the file
 * @returns Whether the file starts with the PNG signature
 */
export function isPng(data: Buffer) {
	return data.subarray(0, pngSignature.length).equals(pngSignature)
}

/**
 * Loads the logo a PDF of an organization item carries. A unit without a logo
 * of its own uses the one of the nearest unit above it; if none of them has
 * one, the logo of the application is used.
 *
 * @param organizationItem - The organization item the PDF belongs to
 * @returns The content of the PNG file
 */
export async function loadOrganizationItemLogo(organizationItem: string | null | undefined) {
	const database = useDatabase()
	const visited = new Set<string>()

	let current = organizationItem ?? null
	while(current && !visited.has(current)) {
		visited.add(current)

		const path = organizationItemLogoPath(current)
		if(existsSync(path)) {
			return await readFile(path)
		}

		const item = await database.query.organizationItems.findFirst({
			where: eq(organizationItems.id, current),
			columns: {
				parent: true,
			},
		})
		current = item?.parent ?? null
	}

	const logo = await useStorage('assets:server').getItemRaw<Buffer>('img/logo.png')
	if(!logo) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Standard-Logo nicht gefunden',
		})
	}
	return logo
}
