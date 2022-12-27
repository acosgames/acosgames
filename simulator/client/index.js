import React from 'react';
import ReactDOM from 'react-dom';

import App from './components/App';

import theme from './theme'
import { ColorModeScript, ChakraProvider } from "@chakra-ui/react"
import './components/app.scss';
// import reportWebVitals from './reportWebVitals';

// import * as serviceWorker from './serviceWorker';


ReactDOM.render(
  // <React.StrictMode>

  <ChakraProvider theme={theme}>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} useSystemColorMode={theme.config.useSystemColorMode} />

    <App />
  </ChakraProvider>
  ,
  // </React.StrictMode>,
  document.getElementById('root')
);


// serviceWorker.register();

// If you want to start measuring performance in your app, pass a function 
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
