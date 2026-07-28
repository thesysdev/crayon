import "./globals.css";
import { Navbar } from "./sections/Navbar/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="homeTheme">{children}</div>
    </>
  );
}
