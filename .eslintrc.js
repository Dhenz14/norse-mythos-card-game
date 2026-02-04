/**
 * ESLint configuration for Norse Mythology Card Game
 * 
 * IMPORTANT: Before making any code modifications, review the comprehensive
 * development rules at: .vscode/DEVELOPMENT_RULES.md
 * 
 * These rules provide detailed guidance on autonomous development,
 * performance thresholds, and comprehensive verification requirements.
 */

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    // Custom rules that will always be applied
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    
    // Norse card game specific rules
    '@typescript-eslint/no-explicit-any': 'warn',
    'max-len': ['warn', { code: 100 }],
    
    // Performance threshold enforcement
    'complexity': ['warn', 15], // Warns when code is too complex
    
    // Card-specific naming conventions
    'camelcase': ['error', { 'properties': 'never', allow: ['^card_', '^effect_'] }],
    
    // Game state management rules
    'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['state'] }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  // Custom overrides for specific directories
  overrides: [
    {
      // Card definition files
      files: ['**/cards/**/*.ts', '**/cards/**/*.tsx'],
      rules: {
        // Custom rule to enforce card property requirements
        'require-card-properties': 'error',
      }
    },
    {
      // Performance-critical code
      files: ['**/game/engine/**/*.ts', '**/3D/**/*.tsx'],
      rules: {
        'no-console': 'error',
        'complexity': ['error', 10], // Stricter complexity limits for game engine
      }
    }
  ]
};