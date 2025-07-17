import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Pressable } from "react-native";

export default function HomeRedirectButton() {
  const router = useRouter();

  const handlePress = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) {
        Alert.alert("Erreur", "Aucune donnée utilisateur.");
        return;
      }

      const user = JSON.parse(userString);
      let role = user?.role?.toLowerCase();

      if (role === "posteur") role = "poster";

      switch (role) {
        case "poster":
        case "offreur":
        case "recruteur":
          router.push("/offreur/home-offer");
          break;
        case "admin":
          router.push("/Admin/dashboard");
          break;
        case "chercheur":
          router.push("/Travailleur/home-user");
          break;
        default:
          Alert.alert("Erreur", "Rôle inconnu.");
      }
    } catch (error) {
      console.error("Erreur AsyncStorage:", error);
      Alert.alert("Erreur", "Échec de la redirection.");
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <Ionicons name="home-outline" size={24} color="#205C3B" />
    </Pressable>
  );
}
