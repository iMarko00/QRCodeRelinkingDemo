import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base: works on <user>.github.io/<repo>/ and on a custom domain.
export default defineConfig({
  base: './',
  plugins: [react()],
})
