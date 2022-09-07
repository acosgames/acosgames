import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Switch,
  Route
} from "react-router-dom";
import MainPage from "./MainPage";

import fs from 'flatstore';
// import GamePanelSpawner from "./games/GameDisplay/GamePanelSpawner";
// import GamePanel from "./GamePanel";
// import { createGamePanel } from "../actions/gamepanel";

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



  return (
    <BrowserRouter>

      <Switch>
        <Route path='*'>
          <MainPage />
        </Route>
      </Switch>

    </BrowserRouter >
  );
}


export default App;
