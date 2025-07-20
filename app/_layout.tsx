import AsyncStorage from "@react-native-async-storage/async-storage";
import { Analytics } from '@vercel/analytics/react';
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import CustomHeader from "./components/CustomHeader"; // Chemin à adapter

export default function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isUserConnected, setIsUserConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const user = await AsyncStorage.getItem("user");
      const isInAuthGroup = segments[0] === "auth";

      if (!user && !isInAuthGroup) {
        // Pas connecté et pas dans /auth => redirection vers login
        router.replace("/auth/login");
      } else if (user && isInAuthGroup) {
        // Connecté et sur /auth => redirection vers accueil
        router.replace("/");
      }

      setIsUserConnected(!!user);
      setIsLoading(false);
    };

    checkUser();
  }, [segments]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    localStorage?.removeItem("user"); // sécurité web
    router.replace("/auth/login");
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#205C3B" />
      </View>
    );
  }

  return (
    <>
      <CustomHeader
        onMenuPress={() => setMenuOpen(true)}
        isUserConnected={isUserConnected}
        onLogout={handleLogout}
      />
      {/* Ici tu peux gérer ton menu latéral avec menuOpen */}

      <Stack screenOptions={{ headerShown: false }} />
      <Analytics />
    </>
  );
}
