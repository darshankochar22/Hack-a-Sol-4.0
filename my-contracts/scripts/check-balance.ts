import { network } from "hardhat";

async function main() {
  console.log("💰 Checking account balance...\n");

  // Connect to network
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [account] = await viem.getWalletClients();

  const address = account.account.address;
  console.log("Account address:", address);

  const balance = await publicClient.getBalance({
    address: address,
  });

  // Convert from wei to ETH
  const balanceInEth = Number(balance) / 1e18;

  console.log("Balance:", balance.toString(), "wei");
  console.log("Balance:", balanceInEth.toFixed(6), "ETH\n");

  if (balance === 0n) {
    console.log("⚠️  WARNING: Account has zero balance!");
    console.log("You need to get testnet tokens from a faucet before deploying.\n");
  } else if (balanceInEth < 0.01) {
    console.log("⚠️  WARNING: Balance is very low!");
    console.log("You might not have enough for deployment. Consider getting more tokens.\n");
  } else {
    console.log("✅ Balance looks good for deployment!\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

