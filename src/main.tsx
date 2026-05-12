import { createRoot } from "react-dom/client";
import { LovableRedirect } from "./pages/LovableRedirect.tsx";
import "./index.css";

// Lovable continues to autobuild this repo and ship it at <project>.lovable.app.
// Any user who lands there should be nudged back to fasterpack.net rather than
// using a stale build that talks to (eventually) nothing.
//
// Dynamic-import App.tsx on non-Lovable hosts only: a static import would
// evaluate the Supabase client at module load even on Lovable, and if
// Lovable's build env is missing VITE_SUPABASE_* (which it now is, since we
// untracked .env), createClient throws and the entire bundle crashes
// — leaving Lovable visitors with a blank page instead of the redirect splash.
const isLovableHost = window.location.hostname.endsWith('.lovable.app');
const root = createRoot(document.getElementById("root")!);

if (isLovableHost) {
  root.render(<LovableRedirect />);
} else {
  void import("./App.tsx").then(({ default: App }) => {
    root.render(<App />);
  });
}
