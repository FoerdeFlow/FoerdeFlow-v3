/**
 * Escapes text so that it can be placed into the HTML an encoder builds without
 * the text being read as markup.
 *
 * @param htmlStr - The text to escape
 * @returns The escaped text
 */
export function escapeHtml(htmlStr: string) {
	return htmlStr.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}
