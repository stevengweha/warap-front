import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Text, TouchableOpacity } from "react-native";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirm = window.confirm("Voulez-vous vraiment vous déconnecter ?");
      if (!confirm) return;

      await AsyncStorage.removeItem("user");
      localStorage.removeItem("user"); // sécurité pour web
      router.replace("/auth/login");
    } else {
      // Sur mobile, utilise Alert
      import("react-native").then(({ Alert }) => {
        Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
          { text: "Annuler", style: "cancel" },
          {
            text: "Déconnexion",
            style: "destructive",
            onPress: async () => {
              await AsyncStorage.removeItem("user");
              router.replace("/auth/login");
            },
          },
        ]);
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={{ padding: 12, backgroundColor: "#c00", borderRadius: 8 }}
    >
      <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
        Déconnexion
      </Text>
    </TouchableOpacity>
  );
}
