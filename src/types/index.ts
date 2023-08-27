import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

export type MintError = Error & { msg?: string; code?: number };

export interface CandyMachineState {
  authority: PublicKey;
  bump: number;
  config: PublicKey;
  data: {
    goLiveDate: BN;
    itemsAvailable: BN;
    price: BN;
    uuid: string;
  };
  itemsRedeemed: BN;
  wallet: PublicKey;
}
