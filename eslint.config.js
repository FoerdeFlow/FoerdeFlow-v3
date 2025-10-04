// @ts-check

import js from '@eslint/js'
import neostandard from 'neostandard'
import tseslint from 'typescript-eslint'
import tsdoc from 'eslint-plugin-tsdoc'
import vue from 'eslint-plugin-vue'
import vuePug from 'eslint-plugin-vue-pug'

import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				ecmaVersion: 2021,
				sourceType: 'module',
			},
		},
	},
	{
		ignores: [ '.old/**' ],
	},

	js.configs.recommended,
	...neostandard(),
	...tseslint.configs.strictTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	...vue.configs['flat/recommended'],
	// @ts-expect-error | eslint-plugin-vue-pug has unspecific types
	...vuePug.configs['flat/recommended'],

	{
		files: [ '**/*.js', '**/*.ts', '**/*.vue' ],
		rules: {
			'no-console': [ 'error', { allow: [ 'warn', 'error' ] } ],
			curly: 'error',
			'no-else-return': 'error',
			'func-style': [ 'error', 'declaration', { allowArrowFunctions: true } ],

			'@stylistic/array-bracket-spacing': [ 'error', 'always' ],
			'@stylistic/arrow-parens': [ 'error', 'always' ],
			'@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
			'@stylistic/indent': [ 'error', 'tab' ],
			'@stylistic/keyword-spacing': [
				'error',
				{
					before: true,
					after: true,
					overrides: {
						if: { after: false },
						for: { after: false },
						while: { after: false },
						catch: { after: false },
						switch: { after: false },
					},
				},
			],
			'@stylistic/no-tabs': 'off',
			'@stylistic/space-before-function-paren': [
				'error',
				{
					anonymous: 'never',
					named: 'never',
					asyncArrow: 'always',
				},
			],

			'@stylistic/max-len': [ 'error', { code: 120, tabWidth: 8 } ],
			'@stylistic/max-statements-per-line': [ 'error', { max: 1 } ],

			'import-x/order': 'error',

			'vue/html-quotes': 'off',
		},
	},
	{
		files: [ '**/*.js', '**/*.ts', '**/*.vue' ],
		plugins: {
			tsdoc,
		},
		rules: {
			'tsdoc/syntax': 'warn',

			'@typescript-eslint/no-unused-vars': [ 'error', {
				args: 'all',
				argsIgnorePattern: '^_',
				caughtErrors: 'all',
				caughtErrorsIgnorePattern: '^_',
				destructuredArrayIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				ignoreRestSiblings: true,
			} ],
			'@typescript-eslint/restrict-template-expressions': [ 'error', {
				allowAny: true,
				allowNumber: true,
			} ],
			'@typescript-eslint/consistent-type-definitions': [ 'error', 'interface' ],
			'@typescript-eslint/no-empty-object-type': [ 'error', {
				allowInterfaces: 'always',
				allowObjectTypes: 'always',
			} ],

			'@typescript-eslint/naming-convention': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
		},
	},
	{
		files: [ '**/*.vue' ],
		rules: {
			'@stylistic/max-len': 'off',
			'vue/max-len': [ 'error', { code: 120, tabWidth: 8, template: 160 } ],
			'vue/multi-word-component-names': 'off',
			'vue/no-multiple-template-root': 'off',
		},
	},
)
