import { RaceControlDashboard } from "../components/RaceControlDashboard";

export function RaceControlPage() {
  return (
    <div style={{ paddingTop: "60px", minHeight: "100vh", background: "#0f172a" }}>
      <RaceControlDashboard onClose={() => window.history.back()} />
    </div>
  );
}

