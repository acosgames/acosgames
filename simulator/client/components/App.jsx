import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainPage from "./MainPage.jsx";

import axios from "axios";
import { btIFrameRoute, btIsMobile } from "../actions/buckets.js";

function App(props) {
    let [, setIsMobile] = useState(false);

    const onResize = () => {
        let screenWidth = window.screen.width;
        let isMobile = screenWidth <= 600;
        setIsMobile(isMobile);
        btIsMobile.set(isMobile);
    };

    const getRoutes = async () => {
        try {
            let response = await axios.get("/routes");

            if (response?.data) {
                btIFrameRoute.set(response?.data?.iframe);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        window.addEventListener("resize", onResize);
        onResize();
        getRoutes();

        return () => {
            window.removeEventListener("resize", onResize);
        };
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="*" element={<MainPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
