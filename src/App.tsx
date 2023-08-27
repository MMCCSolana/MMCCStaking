import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

import { NETWORK, WALLETS } from "./constants";
import { getRpcUrl } from "./utils";

import MintPage from "./pages/MintPage";

import { extendTheme } from "@chakra-ui/react";
import { injectGlobal } from "@emotion/css";

import "react-toastify/dist/ReactToastify.css";

injectGlobal`
  * {
    box-sizing: border-box !important;
  }

  *::selection {
    background: rgba(235,255,0, 20%);
  }
`;

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "#333333",
        color: "#f5eb00",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        paddingBottom: 100,
      },
    },
  },
});

function App() {
  return (
    <ConnectionProvider endpoint={getRpcUrl(NETWORK)}>
      <WalletProvider wallets={WALLETS} autoConnect>
        <WalletModalProvider>
          <ChakraProvider theme={theme}>
            <Router>
              <Switch>
                <Route path="/">
                  <MintPage />
                </Route>
              </Switch>
            </Router>
          </ChakraProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
