module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true,
    node: true 
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react-refresh',
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import',
  ],
  rules: {
    // React 相关规则
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript 相关规则
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/restrict-template-expressions': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // 通用规则
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'warn',
    'no-alert': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-trailing-spaces': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'computed-property-spacing': ['error', 'never'],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'comma-spacing': ['error', { before: false, after: true }],
    'space-before-blocks': 'error',
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    'eol-last': 'error',
    'no-multi-spaces': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],

    // Import 相关规则
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
    }],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off', // TypeScript 处理
    'import/named': 'off', // TypeScript 处理
    'import/default': 'off', // TypeScript 处理
    'import/namespace': 'off', // TypeScript 处理

    // 代码质量规则
    'no-duplicate-imports': 'error',
    'no-useless-rename': 'error',
    'object-shorthand': 'error',
    'prefer-destructuring': ['error', {
      array: false,
      object: true,
    }],
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'no-useless-concat': 'error',
    'no-useless-escape': 'error',
    'no-useless-return': 'error',
    'no-else-return': 'error',
    'no-lonely-if': 'error',
    'no-unneeded-ternary': 'error',
    'no-nested-ternary': 'error',
    'yoda': 'error',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],

    // 性能相关规则
    'no-loop-func': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-array-constructor': 'error',
    'no-new-object': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    {
      files: ['vite.config.ts', '*.config.ts', '*.config.js'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
    {
      files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
};