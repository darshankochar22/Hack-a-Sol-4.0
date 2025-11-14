import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== "undefined" && window.ethereum;
  };

  // Get wallet balance
  const fetchBalance = useCallback(async () => {
    if (!provider || !account) {
      setBalance(null);
      return;
    }

    try {
      const balanceWei = await provider.getBalance(account);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(parseFloat(balanceEth));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(null);
    }
  }, [provider, account]);

  // Handle account changes
  const handleAccountsChanged = useCallback(
    (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setIsConnected(false);
        setChainId(null);
        setBalance(null);
      } else {
        setAccount(accounts[0]);
        fetchBalance();
      }
    },
    [fetchBalance]
  );

  // Handle chain changes
  const handleChainChanged = useCallback(
    (chainId) => {
      setChainId(Number(chainId));
      fetchBalance();
    },
    [fetchBalance]
  );

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
    setBalance(null);

    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    }
  }, [handleAccountsChanged, handleChainChanged]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      alert("Please install MetaMask to connect your wallet!");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        setAccount(accounts[0]);
        setProvider(provider);
        setSigner(signer);
        setIsConnected(true);
        setChainId(Number(network.chainId));

        // Fetch initial balance
        await fetchBalance();

        // Listen for account changes
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if (error.code === 4001) {
        alert("Please connect to MetaMask.");
      } else {
        alert("Error connecting wallet: " + error.message);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [handleAccountsChanged, handleChainChanged, fetchBalance]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (isMetaMaskInstalled()) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });

          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();

            setAccount(accounts[0]);
            setProvider(provider);
            setSigner(signer);
            setIsConnected(true);
            setChainId(Number(network.chainId));

            await fetchBalance();

            window.ethereum.on("accountsChanged", handleAccountsChanged);
            window.ethereum.on("chainChanged", handleChainChanged);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, fetchBalance]);

  // Refresh balance periodically
  useEffect(() => {
    if (isConnected && account) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, account, fetchBalance]);

  return {
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    chainId,
    balance,
    connectWallet,
    disconnectWallet,
    fetchBalance,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  };
}
