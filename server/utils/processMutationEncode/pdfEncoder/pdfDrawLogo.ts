import type jsPDF from 'jspdf'

/**
 * Draws the logo of an organization item into the upper right corner.
 *
 * @param doc - The document to draw into
 * @param organizationItem - The organization item whose logo is drawn, see {@link loadOrganizationItemLogo}
 * @param y - The vertical centre of the logo
 * @returns The width of the drawn logo
 */
export async function pdfDrawLogo(doc: jsPDF, organizationItem: string | null | undefined, y: number) {
	const docWidth = doc.internal.pageSize.getWidth()
	const logo = await loadOrganizationItemLogo(organizationItem)
	const logoProps = doc.getImageProperties(logo)
	const logoHeight = 30
	const logoWidth = logoProps.width / logoProps.height * logoHeight
	doc.addImage(logo, 'PNG', docWidth - logoWidth - 20, y - logoHeight / 2, logoWidth, logoHeight)
	return logoWidth
}
