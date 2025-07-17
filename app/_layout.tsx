import { Analytics } from '@vercel/analytics/react';
import { Stack } from "expo-router";
import { useState } from "react";
import CustomHeader from "./components/CustomHeader"; // Chemin à adapter

export default function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <CustomHeader onMenuPress={() => setMenuOpen(true)} />
      {/* Tu peux afficher un menu latéral ici si menuOpen === true */}

      <Stack screenOptions={{ headerShown: false }} />
      <Analytics />
    </>
  );
}
