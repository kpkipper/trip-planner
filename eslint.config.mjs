import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react(?!.*\\u0000$)'], // 1. React
            ['^next(?!.*\\u0000$)'], // 2. Next.js
            ['^@?\\w(?!.*\\u0000$)'], // 3. Other packages (non-type)
            ['^(?!\\.)(?!.*\\u0000$)'], // 4. Absolute imports e.g. @/ (non-type)
            ['^\\.(?!.*\\u0000$)'], // 5. Relative imports (non-type)
            ['\\u0000$'], // 6. import type
            ['^\\u0000'], // 7. Side-effect imports
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
]

export default eslintConfig
