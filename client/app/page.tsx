"use client"
import { LaserEyesProvider, MAINNET, TESTNET } from "@omnisat/lasereyes";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import Content from "./components/Content";


export default function Page() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;
  return (
    <div>
      <LaserEyesProvider config={{ network: TESTNET }}>
        <Header></Header>
        <Content></Content>
      </LaserEyesProvider>
    </div>
  );
}
