import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import HomeRedirectButton from "./HomeRedirectButton";

export default function CustomHeader({ onMenuPress }: { onMenuPress: () => void }) {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const handleMenuItemPress = (item: string) => {
    setMenuVisible(false);
    console.log("Item choisi :", item);
    // 🔁 Ajoute ici ta logique de navigation (router.push, etc)
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.header}>
        <HomeRedirectButton />

        <Image
          source={require("../../assets/a_sleek_and_modern_image_.png")}
          style={styles.logo}
          resizeMode="cover"
        />

        <TouchableOpacity onPress={toggleMenu} style={styles.iconButton}>
          <Ionicons name="menu-outline" size={28} color="#205C3B" />
        </TouchableOpacity>
      </View>

      {/* Menu déroulant visible via Modal (mobile + web compatible) */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalBackground} onPress={() => setMenuVisible(false)}>
          <View style={styles.dropdownMenu}>
            {[
              { key: "parametres", label: "Paramètres" },
              { key: "accessibilite", label: "Accessibilité" },
              { key: "apropos", label: "À propos" },
              { key: "nouscontacter", label: "Nous contacter" },
              { key: "deconnexion", label: "Déconnexion" },
            ].map((item) => (
              <Pressable
                key={item.key}
                onPress={() => handleMenuItemPress(item.key)}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  headerWrapper: {
    zIndex: 9999,
    elevation: 10,
  },
  header: {
    height: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
 logo: {
  height: 50,
  width: 50,
  borderRadius: 25, // moitié de la largeur/hauteur
  borderWidth: 1,
  borderColor: "#205C3B",
},
  iconButton: {
    padding: 6,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 200,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemPressed: {
    backgroundColor: "#e8f5e9",
  },
  menuItemText: {
    fontSize: 16,
    color: "#205C3B",
  },
});
