import Landing from "./Pages/Landing";
import True from "./Pages/TrustSection";
import Features from "./Pages/Features";
import Works from "./Pages/HowItWorks";
import Getstarted from "./Pages/GetStarted";
import Footer from "./Pages/Footer";
import Dashboard from "./Components/Dashboard";

import { useFirebase } from "./Auth/firebase";

export default function App() {
  const { user, loading } = useFirebase();

  // 🔥 WAIT until Firebase finishes checking auth
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  // 🔥 NOT LOGGED IN → SHOW LANDING
  if (!user) {
    return (
      <>
        <Landing />
        <True />
        <Features />
        <Works />
        <Getstarted />
        <Footer />
      </>
    );
  }

  // 🔥 LOGGED IN → DASHBOARD
  return <Dashboard />;
}