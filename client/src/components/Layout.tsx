import { useLocation } from "wouter";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const hideNavFooter = location === "/login" || location === "/signup" || location === "/engine-test";

  if (hideNavFooter) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 overflow-hidden">
      <Navbar />
      <main className="flex-grow flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
