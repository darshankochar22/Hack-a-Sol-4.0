import { MarketsBoard } from "../components/MarketsBoard";

export function MarketsPage({ provider, signer, account, isConnected }) {
  return (
    <div style={{ paddingTop: "60px", minHeight: "calc(100vh - 60px)", background: "#0f172a" }}>
      <MarketsBoard
        onClose={null}
        provider={provider}
        signer={signer}
        account={account}
        isConnected={isConnected}
        isFullPage={true}
      />
    </div>
  );
}

