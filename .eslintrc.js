module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    "max-len": [
      "error", {
        "code": 120,
        "ignoreComments": true,
        "ignoreStrings": true,
        "ignoreTemplateLiterals": true,
         "ignorePattern": "^import \\{\\n?(\\s+\\w+,\\n?)*|.*\\} from .*$"
        }
      ]
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
    "plugin:@typescript-eslint/strict",
  ],

};