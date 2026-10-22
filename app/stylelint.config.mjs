export default {
	ignoreFiles: [
		"**/node_modules/**",
		"**/.next/**",
		"src/design-system/generated/**",
	],
	rules: {
		"color-no-invalid-hex": true,
		"block-no-empty": true,
		"declaration-block-no-duplicate-properties": true,
		"property-no-unknown": true,
		"selector-pseudo-class-no-unknown": [
			true,
			{ ignorePseudoClasses: ["global", "local"] },
		],
		"at-rule-no-unknown": [true, { ignoreAtRules: ["custom-media"] }],
	},
};
