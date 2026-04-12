import React from "react";
import ReactDOM from "react-dom";

import App from "./components/App";
import initACOSProtocol from "../shared/acos-encoder";
initACOSProtocol();
import theme from "./theme";
import { ColorModeScript, ChakraProvider } from "@chakra-ui/react";
import "./components/app.scss";

import { createRoot } from "react-dom/client";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

root.render(
    <ChakraProvider theme={theme}>
        <ColorModeScript
            initialColorMode={theme.config.initialColorMode}
            // useSystemColorMode={theme.config.useSystemColorMode}
        />
        <App />
    </ChakraProvider>
);
