const js = require('@eslint/js');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Ignore patterns
  {
    ignores: ['dist/', 'node_modules/', '*.js']
  },

  // Main configuration for TypeScript files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      import: importPlugin,
      prettier: prettierPlugin
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // TypeScript ESLint rules
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Import rules (similar to Airbnb)
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          ts: 'never'
        }
      ],
      'import/no-unresolved': 'error',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.ts',
            '**/*.spec.ts',
            '**/build/**',
            '**/scripts/**',
            '**/*.config.ts',
            '**/*.config.js'
          ]
        }
      ],
      'import/prefer-default-export': 'off',
      'import/no-default-export': 'off',

      // General rules (Airbnb-inspired)
      'no-console': 'off', // Allow console for CLI tools
      'no-underscore-dangle': 'off',
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off', // Use TypeScript version instead

      // Code style
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'max-len': ['error', { code: 100, ignoreUrls: true }],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      '@typescript-eslint/no-explicit-any': 'off',

      // Function and variable naming
      'camelcase': ['error', { properties: 'never' }],
      'prefer-const': 'error',
      'no-var': 'error',

      // Best practices
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error'
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        },
        node: {
          extensions: ['.js', '.ts']
        }
      }
    }
  },

  // Prettier config (must be last to override conflicting rules)
  prettierConfig
];
