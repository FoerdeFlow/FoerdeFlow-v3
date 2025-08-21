// @ts-check

import withNuxt from './.nuxt/eslint.config.mjs'
// @ts-expect-error
import vuePug from 'eslint-plugin-vue-pug'

export default withNuxt(
	vuePug,
)
