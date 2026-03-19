"use client";

import { useState, useEffect, createContext, useContext } from "react";
import {
  connectMetaMask,
  getAccounts,
  isMetaMaskInstalled as checkMetaMask,
  isOnGenLayerNetwork,
  switchAccount,
} from "./client";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isMetaMaskInstalled: boolean;
  isOnCorrectNetwork: boolean;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchWalletAccount: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isMetaMaskInstalled: false,
  isOnCorrectNetwork: false,
  isLoading: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchWalletAccount: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const accounts = await getAccounts();
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        const onNetwork = await isOnGenLayerNetwork();
        setIsOnCorrectNetwork(onNetwork);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const connectWallet = async () => {
    const addr = await connectMetaMask();
    setAddress(addr);
    const onNetwork = await isOnGenLayerNetwork();
    setIsOnCorrectNetwork(onNetwork);
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsOnCorrectNetwork(false);
  };

  const switchWalletAccount = async () => {
    const addr = await switchAccount();
    setAddress(addr);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isMetaMaskInstalled: checkMetaMask(),
        isOnCorrectNetwork,
        isLoading,
        connectWallet,
        disconnectWallet,
        switchWalletAccount,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
export function formatAddress(address: string | null, maxLength: number = 12): string {
  if (!address) return "";
  if (address.length <= maxLength) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}