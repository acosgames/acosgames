import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainPage from "./MainPage";

import axios from "axios";
import { btIFrameRoute, btIsMobile } from "../actions/buckets";

function App() {
    const [, setIsMobile] = useState(false);

    const onResize = () => {
        const screenWidth = window.screen.width;
        const isMobile = screenWidth <= 600;
        setIsMobile(isMobile);
        btIsMobile.set(isMobile);
    };

    const getRoutes = async () => {
        try {
            const response = await axios.get("/routes");
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
