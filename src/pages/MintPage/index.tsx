import {
  Container,
  Flex,
  Box,
  Heading,
  Text,
  Link,
  Skeleton,
} from "@chakra-ui/react";
import _ from "lodash";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Image } from "@chakra-ui/image";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { StyledButton, StyledWalletMultiButton } from "./styles";
import { Spinner } from "@chakra-ui/spinner";
import {
  getImage,
  getNFTMetadataForMany,
  getNFTsByOwner,
  INFT,
} from "./utils/metadata";
import { BN, web3 } from "@project-serum/anchor";
import { initGemBank, GemBank } from "./utils/gem-bank";
import { findVaultPDA } from "@gemworks/gem-farm-ts";

const BANK_PK = "3Vk8d8HBEi7bXeZUaZfigAeQpkmvTa7BGbnzk9GN9vg2";
const FILTER_RE = /^Meerkat/;

export default function MintPage() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [nfts, setNfts] = useState<INFT[]>([]);
  const [gbNfts, setGBNfts] = useState<INFT[]>([]);
  const [fetchingGb, setFetchingGb] = useState(true);
  const [vault, setVault] = useState<web3.PublicKey | null>();
  const [gb, setGb] = useState<GemBank>();
  const [clientStaked, setClientStaked] = useState<Record<string, boolean>>({});
  const [mintLoading, setMintLoading] = useState<Record<string, boolean>>({});
  const [starting, setStarting] = useState<boolean>();
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!wallet?.publicKey) {
      setNfts([]);
      setGBNfts([]);
      setVault(undefined);
      return;
    }

    const main = async () => {
      setFetchingGb(true);

      // Get unstaked nfts
      const _nfts = await getNFTsByOwner(
        wallet?.publicKey as web3.PublicKey,
        connection
      );
      const gb = await initGemBank(connection, wallet as any);
      setGb(gb);

      let vaultAddr: web3.PublicKey | void | null = undefined;
      try {
        const bankPk = new web3.PublicKey(BANK_PK);
        const [_vaultAddr] = await findVaultPDA(bankPk, wallet.publicKey!);
        try {
          await gb.fetchVaultAcc(_vaultAddr);
          vaultAddr = _vaultAddr;
          setVault(_vaultAddr);
        } catch (e) {
          // Intentionally set as null vs undefined for no vault
          setVault(null);
        }
      } catch (e) {}

      const filteredNfts = _nfts.filter((n: any) =>
        FILTER_RE.test(n.onchainMetadata.data.name)
      );

      setNfts(filteredNfts);

      // Skip vault check if no fault!
      if (!vaultAddr) return;

      const foundGDRs = await gb.fetchAllGdrPDAs(vaultAddr!);
      if (foundGDRs && foundGDRs.length) {
        const mints = foundGDRs.map((gdr: any) => {
          return { mint: gdr.account.gemMint };
        });
        // Get staked nfts
        const _gbNfts = await getNFTMetadataForMany(mints, connection);
        const pks = _gbNfts.reduce((acc: any, gbnft: any) => {
          const pk = gbnft.mint.toBase58();
          acc[pk] = true;
          return acc;
        }, {});
        setClientStaked(pks);
        setGBNfts(_gbNfts);
      }

      setFetchingGb(false);
    };

    main();
    // eslint-disable-next-line
  }, [wallet?.publicKey]);

  useEffect(() => {
    const main = async () => {
      const images = (
        await Promise.all(
          nfts.map(async (nft) => {
            const image = await getImage((nft as any).onchainMetadata.data.uri);
            return [nft.mint.toBase58(), image] as [string, string];
          })
        )
      ).reduce((acc: any, [mint, image]) => {
        acc[mint] = image;
        return acc;
      }, {}) as Record<string, string>;

      setImages(images);
    };

    main();
  }, [nfts]);

  const stake = async (
    mint: web3.PublicKey,
    creator: web3.PublicKey,
    source: web3.PublicKey
  ) => {
    if (!gb) return;

    try {
      setMintLoading({
        ...mintLoading,
        [mint.toBase58()]: true,
      });

      await gb.depositGemWallet(
        new web3.PublicKey(BANK_PK),
        vault!,
        new BN(1),
        mint,
        source,
        creator
      );

      setClientStaked({
        ...clientStaked,
        [mint.toBase58()]: true,
      });

      toast.success("Mint staked successfully!");
    } catch (e) {
      console.error(e);
      // @ts-ignore
      toast.error(e.message);
    } finally {
      setMintLoading({
        ...mintLoading,
        [mint.toBase58()]: false,
      });
    }
  };

  const unstake = async (mint: web3.PublicKey) => {
    if (!gb) return;

    try {
      setMintLoading({
        ...mintLoading,
        [mint.toBase58()]: true,
      });

      await gb.withdrawGemWallet(
        new web3.PublicKey(BANK_PK),
        vault!,
        new BN(1),
        mint
      );

      setClientStaked({
        ...clientStaked,
        [mint.toBase58()]: false,
      });

      toast.success("Mint unstaked successfully!");
    } catch (e) {
      console.error(e);
      // @ts-ignore
      toast.error(e.message);
    } finally {
      setMintLoading({
        ...mintLoading,
        [mint.toBase58()]: false,
      });
    }
  };

  const handleClick = async (nft: INFT, isStaked: boolean) => {
    if (isStaked) {
      await unstake(nft.mint);
    } else {
      const creator = new web3.PublicKey(
        (nft.onchainMetadata as any).data.creators[0].address
      );
      await stake(nft.mint, creator, nft.pubkey!);
    }
  };

  const handleCreateVault = async () => {
    try {
      setStarting(true);
      const { vault } = await gb!.initVaultWallet(new web3.PublicKey(BANK_PK));
      setVault(vault);
      toast.success("Success!");
    } catch (e) {
      console.error(e);
      // @ts-ignore
      toast.error(e.message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <Container
        display="flex"
        maxW="full"
        px={16}
        mt={8}
        mb={3}
        justifyContent="flex-end"
      >
        <StyledWalletMultiButton />
      </Container>
      <Container maxW="5xl" textAlign="center">
        <ToastContainer theme="dark" />
        <Heading as="h2" color="white" mb={5}>
          You can stake or unstake your Meerkats here for greater good.
        </Heading>
        <Heading
          as="h1"
          pb={5}
          lineHeight={1.2}
          fontWeight={700}
          fontSize={60}
          textShadow="5px 0 #8c8700"
        >
          Meerkat Millionaires Club
        </Heading>
        {vault && (
          <Text mb={4} color="white">
            Vault: {vault.toBase58()}
          </Text>
        )}

        {!nfts.length && !gbNfts.length && !fetchingGb && (
          <Link
            href="https://solanart.io/collections/meerkatmillionairescc"
            target="_blank"
          >
            Buy some Kats to stake
          </Link>
        )}

        {vault === null && (
          <Flex justifyContent="center">
            <StyledButton onClick={handleCreateVault} disabled={starting}>
              {starting ? <Spinner size="md" /> : <>Start Staking</>}
            </StyledButton>
          </Flex>
        )}

        {fetchingGb ? (
          wallet?.publicKey && vault !== null && <Spinner size="xl" />
        ) : (
          <Flex justifyContent="space-evenly" flexWrap="wrap">
            {_.sortBy([...nfts, ...gbNfts], (n: any) =>
              Number(n.onchainMetadata.data.name.split("#")[1])
            ).map((nft: any) => {
              const isStaked = Boolean(clientStaked[nft.mint.toBase58()]);
              const isLoading = Boolean(mintLoading[nft.mint.toBase58()]);

              return (
                <Box
                  key={`${
                    isStaked ? "staked" : "unstaked"
                  }.${nft.mint.toBase58()}`}
                  mb={4}
                >
                  <Skeleton
                    isLoaded={!!images[nft.mint.toBase58()]}
                    width="215px"
                    height="215px"
                  >
                    <Image src={images[nft.mint.toBase58()]} width={215} />
                  </Skeleton>
                  <Text color="white" fontSize="xl" mt={2}>
                    {nft.onchainMetadata.data.name}
                  </Text>
                  <Box mt={2} mb={3}>
                    {wallet?.connected && (
                      <>
                        <Box textAlign="center">
                          <StyledButton
                            onClick={() => handleClick(nft, isStaked)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Spinner size="md" />
                            ) : isStaked ? (
                              <Text fontSize="2xl">Unstake</Text>
                            ) : (
                              <Text fontSize="2xl">Stake</Text>
                            )}
                          </StyledButton>
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Flex>
        )}
      </Container>
    </>
  );
}
