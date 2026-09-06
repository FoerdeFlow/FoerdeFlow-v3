export interface PdfSignatureOptions {
	name: string
	hint: string | null
	lines: { label: string, hint: string | null }[]
}

export interface PdfEncoderOptions {
	document?: boolean
	signature?: PdfSignatureOptions
}
