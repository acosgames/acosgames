import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { splitVendorChunkPlugin } from "vite";
// import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import * as r from "react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // visualizer()
    ],
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
        },

        outDir: "../api/public",
    },

    resolve: {
        alias: {
            shared: path.resolve(__dirname, "../shared"),
        },
    },
});
