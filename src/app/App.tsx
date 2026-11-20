import { AppProvider, useApp } from "./context/AppContext";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { Explore } from "./components/Explore";
import { Services } from "./components/Services";
import { Barbers } from "./components/Barbers";
import { Booking } from "./components/Booking";
import { Reviews } from "./components/Reviews";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";
import { SalonDetailModal } from "./components/SalonDetailModal";
import { CustomerBookingsModal } from "./components/CustomerBookingsModal";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ToastContainer } from "./components/ToastContainer";

function MainContent() {
  const { activeView } = useApp();

  return (
    <div
      style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        minHeight: "100vh",
        backgroundColor: "#F6F1E7",
      }}
    >
      <Navigation />

      {activeView === "landing" && (
        <>
          <Hero />
          <Explore />
          <Services />
          <Barbers />
          <Booking />
          <Reviews />
        </>
      )}

      {activeView === "owner" && <OwnerDashboard />}
      {activeView === "admin" && <AdminDashboard />}

      <Footer />

      {/* Interactive Modals & Global Toast */}
      <AuthModal />
      <SalonDetailModal />
      <CustomerBookingsModal />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
