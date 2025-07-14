import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const user = JSON.parse(userString);
          // Correction : accepte aussi "posteur" comme synonyme de "poster"
          let normalizedRole = user.role?.toLowerCase();
          if (normalizedRole === "posteur") normalizedRole = "poster";
          setRole(normalizedRole || null);
          console.log("BottomTabBar - rôle utilisateur détecté :", normalizedRole);
        } else {
          setRole(null);
          console.log("BottomTabBar - aucun user trouvé dans AsyncStorage");
        }
      } catch (error) {
        console.error("Erreur AsyncStorage rôle:", error);
        setRole(null);
      }
    };
    getRole();
  }, []);

  // Affiche rien tant que le rôle n'est pas chargé
  if (role === null) {
    console.log("BottomTabBar - rôle non chargé, rien à afficher");
    return null;
  }

  // Définition dynamique des tabs selon le rôle
  let homeRoute = "/Travailleur/home-user";
  let manageRoute = "/Jobs/ManageJob";
  if (role === "poster" || role === "offreur" || role === "recruteur") {
    homeRoute = "/offreur/home-offer";
    manageRoute = "/Jobs/Management";
  } else if (role === "admin") {
    homeRoute = "/Admin/dashboard";
    manageRoute = "/Admin/ManageAll";
  }
  console.log(
    "BottomTabBar - homeRoute:",
    homeRoute,
    "manageRoute:",
    manageRoute,
    "pathname:",
    pathname
  );

  const tabs = [
    {
      route: homeRoute,
      icon: "home",
      match: homeRoute,
    },
    {
      route: manageRoute,
      icon: "briefcase",
      match: manageRoute,
    },
    {
      route: "/messages/smslist",
      icon: "chatbubble-ellipses",
      match: "/messages/smslist",
    },
    {
      route: "/profiles/dashprofile",
      icon: "person",
      match: "/profiles/dashprofile",
    },
  ];

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.match);
          if (tab.icon === "home" || tab.icon === "briefcase") {
            console.log(
              `BottomTabBar - Tab: ${tab.icon} | route: ${tab.route} | match: ${tab.match} | isActive: ${isActive}`
            );
          }
          return (
            <TouchableOpacity
              key={tab.route}
              onPress={() => {
                if (!isActive) {
                  console.log(`BottomTabBar - Navigation vers ${tab.route}`);
                  router.replace(tab.route);
                }
              }}
              style={isActive ? styles.activeTab : undefined}
            >
              <Ionicons
                name={tab.icon}
                size={28}
                color={isActive ? "#fff" : "#205C3B"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    // Monte la barre de 16px pour ne pas être collée au bord bas
    bottom: 16,
    backgroundColor: "#F7F8F5",
    zIndex: 100,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 2,
    borderColor: "#205C3B",
    backgroundColor: "#F7F8F5",
    borderRadius: 18,
    marginHorizontal: 16,
  },
  activeTab: {
    backgroundColor: "#205C3B",
    borderRadius: 20,
    padding: 6,
  },
});
