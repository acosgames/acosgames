import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// import { splitVendorChunkPlugin } from "vite";
// import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import * as r from "react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        cssInjectedByJsPlugin(),
        // visualizer()
    ],
    esbulid: {
        target: "esbuild",
    },
    injectManifest: {
        rollupFormat: "iife",
    },
    server: {
        port: 3250,
        origin: "http://localhost:3100",
        // open: "http://localhost:3100",
    },
    build: {
        manifest: true,
        sourcemap:
            process.env.NODE_ENV == "prod" ||
            process.env.NODE_ENV == "production"
                ? false
                : "inline",
        rollupOptions: {
            input: "./main.jsx",
            output: {
                entryFileNames: "bundle.production.js",
                // assetFileNames: `[name].[ext]`,
                // manualChunks: undefined,
            },
        },

        outDir: "../server/public",
    },
    optimizeDeps: {
        include: ["acos-json-encoder", "acos-json-delta"],
    },
    resolve: {
        alias: {
            shared: path.resolve(__dirname, "../shared"),
        },
    },
});
