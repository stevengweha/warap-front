import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

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
          let normalizedRole = user.role?.toLowerCase();
          if (normalizedRole === "posteur") normalizedRole = "poster";
          setRole(normalizedRole || null);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Erreur AsyncStorage rôle:", error);
        setRole(null);
      }
    };
    getRole();
  }, []);

  if (role === null) return null;

  let homeRoute = "/Travailleur/home-user";
  let manageRoute = "/Jobs/ManageJob";
  if (role === "poster" || role === "offreur" || role === "recruteur") {
    homeRoute = "/offreur/home-offer";
    manageRoute = "/Jobs/Management";
  } else if (role === "admin") {
    homeRoute = "/Admin/dashboard";
    manageRoute = "/Admin/ManageAll";
  }

  const tabs = [
    { route: homeRoute, icon: "home", match: homeRoute },
    { route: manageRoute, icon: "briefcase", match: manageRoute },
    { route: "/messages/smslist", icon: "chatbubble-ellipses", match: "/messages/smslist" },
    { route: "/profiles/dashprofile", icon: "person", match: "/profiles/dashprofile" },
  ];

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.match);

          return (
            <Pressable
              key={tab.route}
              onPress={() => {
                if (!isActive) router.push(tab.route);
              }}
              style={({ hovered }) => [
                styles.tabButton,
                isActive && styles.activeTab,
                hovered && !isActive && styles.hoverTab,
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={26}
                color={isActive ? "#fff" : "#205C3B"}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F7F8F5",
    borderTopWidth: 1,
    borderColor: "#ccc",
    zIndex: 100,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  tabButton: {
    padding: 10,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#205C3B",
  },
  hoverTab: {
    backgroundColor: "#DCEFE3",
  },
});
