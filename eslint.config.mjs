import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
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
])

export default eslintConfig
