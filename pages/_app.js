import { Inter, DM_Mono } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500"],
});

export default function App({ Component, pageProps }) {
  return (
    <main className={`${inter.variable} ${dmMono.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}