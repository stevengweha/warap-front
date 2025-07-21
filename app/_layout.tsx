import AsyncStorage from "@react-native-async-storage/async-storage";
import { Analytics } from '@vercel/analytics/react';
import { Stack, useRouter, useSegments } from "expo-router";
import Head from "expo-router/head";
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
    <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wa-Rap" />
        <link rel="apple-touch-icon" href="/warap.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/warap.png" />
        <meta name="theme-color" content="#4CAF50" />
        <link rel="icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('service-worker.js')
                    .then(reg => console.log('✅ Service Worker registered:', reg.scope))
                    .catch(err => console.error('❌ SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </Head>
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
