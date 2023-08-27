import { web3 } from "@project-serum/anchor";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  getPhantomWallet,
  getSolletWallet,
  getSolflareWallet,
} from "@solana/wallet-adapter-wallets";

// Project Specific Config
export const CANDY_MACHINE_CONFIG =
  "FBtkf9fcm5FXtWq4sPAjPp4JfyoV4ee8dP5Azh1FNS2";
export const CANDY_MACHINE_UUID = "FBtkf9";
export const START_DATE = 1633125660;
export const RPC_MAINNET_URL =
  "https://dawn-lively-cloud.solana-mainnet.quiknode.pro/b848b3c430c73fce79dc707793ee68cb94eaf2fa/";
export const RPC_DEVNET_URL =
  "https://white-sparkling-wind.solana-devnet.quiknode.pro/a78aff6bb3aa64bedc4c2f178f33b061928b4f90/";
export const NETWORK = WalletAdapterNetwork.Mainnet;
export const WALLETS = [
  getPhantomWallet(),
  getSolflareWallet(),
  getSolletWallet({ network: NETWORK }),
];

// Candy Machine Specific Config
export const CANDY_MACHINE = "candy_machine";
export const PROGRAM_ID = new web3.PublicKey(
  "cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ"
);
export const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new web3.PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);
export const TOKEN_PROGRAM_ID = new web3.PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
