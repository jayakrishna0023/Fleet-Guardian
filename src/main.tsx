import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import database tests (will auto-run in dev mode)
import './tests/databaseTest';

// Import email service to expose test functions
import './services/emailService';

createRoot(document.getElementById("root")!).render(<App />);
