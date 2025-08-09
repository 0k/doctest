/// <reference types="vitest" />
import { defineConfig } from 'vite'

const cfg =  defineConfig({
    test: {
        include: ['src/**/*.{js,ts}', 'tests/*.test.ts'],
        setupFiles: ['./tests/setup.ts'],
        environment: 'jsdom',
        passWithNoTests: true,
        bail: 1,
    },
    server: {
      watch: {
        include: ['README.org'],
      }
    }
})

export default cfg
