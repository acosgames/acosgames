import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import path from "path";

export default defineConfig({
    plugins: [
        react(),
        cssInjectedByJsPlugin(),
    ],
    oxc: {
        target: "esnext",
    },
    server: {
        port: 3250,
        origin: "http://localhost:3100",
    },
    build: {
        manifest: true,
        sourcemap:
            process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "production"
                ? true
                : "inline",
        rollupOptions: {
            input: "./main.tsx",
            output: {
                entryFileNames: "bundle.production.js",
            },
        },
        outDir: "../../dist/public",
    },
    optimizeDeps: {
        include: ["acos-json-encoder"],
    },
    resolve: {
        alias: {
            shared: path.resolve(__dirname, "../shared"),
            acosgames: path.resolve(__dirname, "../../framework/index.ts"),
        },
    },
});
