import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { LovableRedirect } from "./pages/LovableRedirect.tsx";
import "./index.css";

// Lovable continues to autobuild this repo and ship it at <project>.lovable.app.
// Any user who lands there should be nudged back to fasterpack.net rather than
// using a stale clone that talks to (eventually) nothing. We short-circuit
// before mounting the full app so the auth flow / data fetching never starts.
const isLovableHost = window.location.hostname.endsWith('.lovable.app');

createRoot(document.getElementById("root")!).render(
  isLovableHost ? <LovableRedirect /> : <App />,
);
