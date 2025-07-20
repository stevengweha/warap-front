module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{js,html,png,ico,ttf,json}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};