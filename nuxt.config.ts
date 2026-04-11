export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	typescript: {
		tsConfig: {
			compilerOptions: {
				moduleResolution: 'bundler',
			},
		},
	},
	experimental: {
		typedPages: true,
	},
	nitro: {
		experimental: {
			asyncContext: true,
			tasks: true,
		},
		scheduledTasks: {
			'55 * * * *': 'mail:reminder',
		},
	},
	devServer: {
		port: 3000,
		https: true,
	},
	devtools: {
		enabled: true,
	},
	app: {
		head: {
			title: 'FördeFlow | StuPa HAW Kiel',
			link: [
				{ rel: 'icon', type: 'image/png', href: '/favicon.png' },
			],
			htmlAttrs: {
				lang: 'de',
			},
		},
	},
	modules: [
		'@nuxt/eslint',
		'@nuxtjs/tailwindcss',
		'@pinia/nuxt',
		'pinia-plugin-persistedstate/nuxt',
		'@nuxtjs/i18n',
	],
	css: [
		'~/assets/css/main.css',
	],
	tailwindcss: {
		exposeConfig: true,
		viewer: true,
	},
	i18n: {
		strategy: 'no_prefix',
		defaultLocale: 'de',
		locales: [
			{ code: 'de', name: 'Deutsch', file: 'de.json' },
			{ code: 'en', name: 'English', file: 'en.json' },
		],
	},
	runtimeConfig: {
		public: {
			environment: 'development',
		},
		database: {
			user: 'foerdeflow',
			password: 'foerdeflow',
			host: 'localhost',
			port: 5432,
			name: 'foerdeflow',
		},
		externalURL: 'https://localhost:3000',
		apiKey: '00000000000000000000000000000000',
		sessionSecret: '00000000000000000000000000000000',
		oidcProvider: {
			clientId: 'dev',
			clientSecret: 'dev',
			server: 'https://localhost:3000/api/auth/oidc/provider',
		},
		openslides: {
			server: 'https://localhost:8000',
			username: 'superadmin',
			password: 'superadmin',
		},
		minutes: {
			url: 'https://dfncloud.haw-kiel.de/s/8XpT4EqmAZwtoNQ/download' +
				'?path=%2F__PERIOD__&files=P-__ITEM__-__QNUMBER__.pdf',
		},
		mail: {
			host: 'localhost',
			port: 1025,
			username: 'root',
			password: '',
			from: 'FördeFlow <root@localhost>',
		},
	},
})
