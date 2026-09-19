/** The writing position an encoder walks down the pages with. */
export interface PdfPosition {
	y: number
	/**
	 * Starts a new page unless the given height still fits on the current one.
	 *
	 * @param height - The height of the block about to be drawn
	 */
	reserve(height: number): void
}

export interface PdfSignatureOptions {
	name: string
	hint: string | null
	lines: { label: string, hint: string | null }[]
}

export interface PdfEncoderOptions {
	document?: boolean
	signature?: PdfSignatureOptions
}
