import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), svgr(), tsconfigPaths()],
    base: "/static-invoice/",

    // // https://github.com/vitejs/vite/issues/5668#issuecomment-968125763
    optimizeDeps: {
        include: ['@keagate/common']
    },
    build: {
        commonjsOptions: {
            include: [/common/, /node_modules/]
        }
    }
})