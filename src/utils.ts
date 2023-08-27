import { Provider, Program, web3 } from "@project-serum/anchor";
import { MintLayout, Token } from "@solana/spl-token";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import * as anchor from "@project-serum/anchor";
import {
  SystemProgram,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Connection,
} from "@solana/web3.js";

import {
  CANDY_MACHINE_CONFIG,
  CANDY_MACHINE_UUID,
  CANDY_MACHINE,
  PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  RPC_MAINNET_URL,
  RPC_DEVNET_URL,
} from "./constants";
import { MintError } from "./types";
import { WalletContextState } from "@solana/wallet-adapter-react";

const getTokenWallet = async function (wallet: PublicKey, mint: PublicKey) {
  return (
    await web3.PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    )
  )[0];
};

const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey
) => {
  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: walletAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: splTokenMintAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: web3.SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new web3.TransactionInstruction({
    keys,
    programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    data: Buffer.from([]),
  });
};

const getCandyMachine = async (config: anchor.web3.PublicKey, uuid: string) => {
  return (
    await PublicKey.findProgramAddress(
      [Buffer.from(CANDY_MACHINE), config.toBuffer(), Buffer.from(uuid)],
      PROGRAM_ID
    )
  )[0];
};

const getMasterEdition = async (mint: PublicKey) => {
  return (
    await PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};

export const fetchCandyMachineState = async ({
  wallet,
  connection,
}: {
  wallet?: WalletContextState;
  connection: Connection;
}) => {
  const provider = new Provider(
    connection,
    wallet
      ? ({
          ...wallet.wallet,
          signAllTransactions: wallet.signAllTransactions,
          signTransaction: wallet.signTransaction,
          publicKey: wallet.publicKey,
        } as anchor.Wallet)
      : ({} as anchor.Wallet),
    {
      preflightCommitment: "recent",
    }
  );

  const idl = await Program.fetchIdl(PROGRAM_ID, provider);
  // @ts-ignore
  const anchorProgram = new Program(idl, PROGRAM_ID, provider);
  const config = new web3.PublicKey(CANDY_MACHINE_CONFIG);
  const candyMachine = await getCandyMachine(config, CANDY_MACHINE_UUID);
  const candy = await anchorProgram.account.candyMachine.fetch(candyMachine);

  return {
    provider,
    idl,
    anchorProgram,
    config,
    candyMachine,
    candy,
  };
};

const getMetadata = async (mint: PublicKey) => {
  return (
    await web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};

export const mint = async ({
  wallet,
  connection,
}: {
  wallet: WalletContextState;
  connection: Connection;
}): Promise<string | undefined> => {
  const mint = web3.Keypair.generate();

  if (wallet && wallet.wallet && wallet.publicKey) {
    const token = await getTokenWallet(wallet.publicKey, mint.publicKey);
    const { provider, anchorProgram, config, candyMachine, candy } =
      await fetchCandyMachineState({ wallet, connection });
    const metadata = await getMetadata(mint.publicKey);
    const masterEdition = await getMasterEdition(mint.publicKey);

    return anchorProgram.rpc.mintNft({
      accounts: {
        config: config,
        candyMachine: candyMachine,
        payer: wallet.publicKey,
        // @ts-ignore
        wallet: candy.wallet,
        mint: mint.publicKey,
        metadata,
        masterEdition,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: SYSVAR_CLOCK_PUBKEY,
      },
      signers: [mint],
      instructions: [
        web3.SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: await provider.connection.getMinimumBalanceForRentExemption(
            MintLayout.span
          ),
          programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          0,
          wallet.publicKey,
          wallet.publicKey
        ),
        createAssociatedTokenAccountInstruction(
          token,
          wallet.publicKey,
          wallet.publicKey,
          mint.publicKey
        ),
        Token.createMintToInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          token,
          wallet.publicKey,
          [],
          1
        ),
      ],
    });
  }
};

export const getPublicKeyDisplay = (publicKey: PublicKey) => {
  const base58 = publicKey.toBase58();
  return base58.substr(0, 5) + "..." + base58.substr(base58.length - 5);
};

export const parseMintError = (error: MintError): string => {
  let message =
    error.message || error.msg || "Minting failed! Please try again!";

  if (message.startsWith("Signature request denied")) {
    message = "Signature request denied! ";
  } else if (
    message.startsWith(
      "failed to send transaction: Transaction simulation failed: "
    )
  ) {
    message = message.split("failed: ")?.[1];
  } else if (message.startsWith("unknown signer:")) {
    message = "Please make sure to sign with the connected address.";
  } else if (error.code === 311) {
    message = "Sorry we've sold out!";
  } else if (error.code === 312) {
    message = "Minting period hasn't started yet.";
  } else if (error.code === 309) {
    message = "Insufficient funds to mint. Please fund your wallet.";
  }

  return message;
};

export const getTransactionLink = (tx: string) => `https://solscan.io/tx/${tx}`;

export const getRpcUrl = (network: WalletAdapterNetwork) => {
  switch (network) {
    case WalletAdapterNetwork.Mainnet:
      return RPC_MAINNET_URL;
    case WalletAdapterNetwork.Devnet:
    default:
      return RPC_DEVNET_URL;
  }
};
