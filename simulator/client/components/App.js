import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Switch,
  Route
} from "react-router-dom";
import MainPage from "./MainPage";

import fs from 'flatstore';
// import GamePanelSpawner from "./games/GameDisplay/GamePanelSpawner";
import GamePanel from "./GamePanel";
import { createGamePanel } from "../actions/gamepanel";

fs.delimiter('>');
fs.set("isMobile", false);

function App(props) {

  let [, setIsMobile] = useState(false);

  const onResize = () => {
    let screenWidth = window.screen.width;
    let isMobile = screenWidth <= 600;
    setIsMobile(isMobile);
    fs.set("isMobile", isMobile)
  }

  useEffect(() => {
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
    }
  }, [])

  useEffect(() => {

    let defaultConfig = {
      screentype: 3,
      resow: 4,
      resoh: 4,
      screenwidth: 1920
    }

    createGamePanel(defaultConfig)
    // addRoom(defaultRoom);

  }, [])

  return (
    <BrowserRouter>

      <Switch>
        <Route path='*'>
          <MainPage />
        </Route>
      </Switch>
      <GamePanel />
    </BrowserRouter >
  );
}


export default App;
