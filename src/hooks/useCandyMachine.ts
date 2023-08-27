import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchCandyMachineState } from "../utils";
import { START_DATE } from "../constants";
import { CandyMachineState } from "../types";
import { useInterval } from "react-use";

export const useCandyMachine = () => {
  const [isMinting, setIsMinting] = useState(false);
  const [candyMachineState, setCandyMachineState] =
    useState<CandyMachineState>();
  const { connection } = useConnection();
  const [isPolling, setIsPolling] = useState(false);

  const fetchData = async () => {
    setIsPolling(true);
    try {
      const state = await fetchCandyMachineState({ connection });
      setCandyMachineState(state.candy as CandyMachineState);
    } catch (e) {}
  };

  useInterval(fetchData, isPolling ? 10e3 : null);

  const startDate = START_DATE
    ? new Date(Number(START_DATE) * 1000)
    : undefined;

  useEffect(() => {
    if (!candyMachineState) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candyMachineState, connection]);

  return {
    candyMachineState,
    isMinting,
    setIsMinting,
    startDate,
  };
};
