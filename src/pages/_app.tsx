import "@/styles/globals.css";
import "@/styles/react-calendar.css";
import "@/styles/rjsf.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <SessionProvider session={pageProps.session}>
      <Head>
        <title>OFMI</title>
        <link rel="icon" href="lightLogo.svg" />
      </Head>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </SessionProvider>
  );
}
