import { BN, Idl } from "@project-serum/anchor";
import {
  findWhitelistProofPDA,
  GEM_BANK_PROG_ID,
  GemBankClient,
  WhitelistType,
} from "@gemworks/gem-farm-ts";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { programs } from "@metaplex/js";

//need a separate func coz fetching IDL is async and can't be done in constructor
export async function initGemBank(
  conn: Connection,
  wallet: SignerWalletAdapter
) {
  const walletToUse = wallet;
  const idl = await (await fetch("gem_bank.json")).json();
  return new GemBank(conn, walletToUse as any, idl);
}

export class GemBank extends GemBankClient {
  constructor(conn: Connection, wallet: any, idl: Idl) {
    super(conn, wallet, idl, GEM_BANK_PROG_ID);
  }

  async initBankWallet() {
    const bank = Keypair.generate();
    const txSig = await this.initBank(
      bank,
      this.wallet.publicKey,
      this.wallet.publicKey
    );
    return { bank, txSig };
  }

  async initVaultWallet(bank: PublicKey) {
    return this.initVault(
      bank,
      this.wallet.publicKey,
      this.wallet.publicKey,
      this.wallet.publicKey,
      "test_vault"
    );
  }

  async setVaultLockWallet(
    bank: PublicKey,
    vault: PublicKey,
    vaultLocked: boolean
  ) {
    return this.setVaultLock(bank, vault, this.wallet.publicKey, vaultLocked);
  }

  async depositGemWallet(
    bank: PublicKey,
    vault: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey,
    gemSource: PublicKey,
    creator: PublicKey
  ) {
    const [mintProof] = await findWhitelistProofPDA(bank, gemMint);
    const [creatorProof] = await findWhitelistProofPDA(bank, creator);
    const metadata = await programs.metadata.Metadata.getPDA(gemMint);

    return this.depositGem(
      bank,
      vault,
      this.wallet.publicKey,
      gemAmount,
      gemMint,
      gemSource,
      mintProof,
      metadata,
      creatorProof
    );
  }

  async withdrawGemWallet(
    bank: PublicKey,
    vault: PublicKey,
    gemAmount: BN,
    gemMint: PublicKey
  ) {
    return this.withdrawGem(
      bank,
      vault,
      this.wallet.publicKey,
      gemAmount,
      gemMint,
      this.wallet.publicKey
    );
  }

  async addToWhitelistWallet(
    bank: PublicKey,
    addressToWhitelist: PublicKey,
    whitelistType: WhitelistType
  ) {
    return this.addToWhitelist(
      bank,
      this.wallet.publicKey,
      addressToWhitelist,
      whitelistType
    );
  }

  async removeFromWhitelistWallet(bank: PublicKey, addressToRemove: PublicKey) {
    return this.removeFromWhitelist(
      bank,
      this.wallet.publicKey,
      addressToRemove
    );
  }
}
