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
      // Handle RPC errors gracefully - don't set balance to null
      if (
        error.message?.includes("RPC endpoint") ||
        error.code === -32002 ||
        error.message?.includes("too many errors")
      ) {
        // Don't set balance to null, keep last known value
        return;
      }
      // Only set to null if it's a different type of error
      if (!error.message?.includes("RPC")) {
        setBalance(null);
      }
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

        try {
          const network = await provider.getNetwork();
          const networkChainId = Number(network.chainId);

          setAccount(accounts[0]);
          setProvider(provider);
          setSigner(signer);
          setIsConnected(true);
          setChainId(networkChainId);

          // Fetch initial balance (with error handling)
          try {
            await fetchBalance();
          } catch (balanceError) {
            // Continue even if balance fetch fails
          }

          // Listen for account changes
          window.ethereum.on("accountsChanged", handleAccountsChanged);
          window.ethereum.on("chainChanged", handleChainChanged);
        } catch (networkError) {
          // Handle RPC errors when getting network info
          if (
            networkError.message?.includes("RPC endpoint") ||
            networkError.code === -32002
          ) {
            setIsConnecting(false);
            return;
          }
          throw networkError; // Re-throw if it's a different error
        }
      }
    } catch (error) {
      if (error.code === 4001) {
        // User rejected - silent fail
      } else {
        // Other errors - silent fail
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

            try {
              const network = await provider.getNetwork();
              const networkChainId = Number(network.chainId);

              setAccount(accounts[0]);
              setProvider(provider);
              setSigner(signer);
              setIsConnected(true);
              setChainId(networkChainId);

              // Fetch initial balance (with error handling)
              try {
                await fetchBalance();
              } catch (balanceError) {
                // Continue even if balance fetch fails
              }

              window.ethereum.on("accountsChanged", handleAccountsChanged);
              window.ethereum.on("chainChanged", handleChainChanged);
            } catch (networkError) {
              // Handle RPC errors when getting network info
              if (
                networkError.message?.includes("RPC endpoint") ||
                networkError.code === -32002
              ) {
                // Don't set connection state if RPC is failing
                return;
              }
            }
          }
        } catch (error) {
          // Silent fail on connection check
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

  // Refresh balance periodically (with longer interval to avoid RPC overload)
  useEffect(() => {
    if (isConnected && account) {
      // Initial fetch
      fetchBalance();
      // Refresh every 30 seconds (longer interval to avoid RPC errors)
      const interval = setInterval(() => {
        fetchBalance();
      }, 30000);
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
