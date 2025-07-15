import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function add() {
  const [userType, setRole] = useState<"poster" | "chercheur" | null>(null);
  const [bio, setBio] = useState("");
  const [competences, setCompetences] = useState(""); // à parser en JSON si besoin
  const [photoProfil, setPhotoProfil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Récupère le token passé depuis register (si tu le passes en navigation)
  // const { token } = useLocalSearchParams();

  // Selectionne une image dans la galerie
  // et met à jour l'état photoProfil avec l'URI de l'image sélectionnée
  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setPhotoProfil(res.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!userType || !bio || !competences) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setLoading(true);
    try {
      // Récupère le token depuis le stockage local si besoin
      // const token = await AsyncStorage.getItem("token");
      const token = ""; // À remplacer par la vraie récupération du token

      const response = await fetch("https://warap-back.onrender.com/api/auth/complete-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: userType,
          bio,
          competences,
          photoProfil,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Erreur", data.message || "Erreur lors de la complétion du profil.");
        setLoading(false);
        return;
      }
      Alert.alert("Succès", "Profil complété avec succès !");
      // Redirige selon le rôle si besoin
      // router.push(...);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de compléter le profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={32} color="#205C3B" style={{ marginRight: 8 }} />
        <Text style={styles.logo}>Compléter le profil</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Ajoutez vos informations</Text>
        <Text style={styles.subtitle}>Finalisez votre inscription</Text>

        {/* Photo de profil */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          {photoProfil ? (
            <Image source={{ uri: photoProfil }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: "#eee", justifyContent: "center", alignItems: "center" }]}>
              <Ionicons name="camera" size={32} color="#aaa" />
            </View>
          )}
          <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
            <Text style={{ color: "#205C3B" }}>Choisir une photo</Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <TextInput
          style={styles.input}
          placeholder="Votre bio"
          placeholderTextColor="#888"
          value={bio}
          onChangeText={setBio}
          multiline
        />

        {/* Type d'utilisateur */}
        <Text style={{ marginBottom: 8, color: "#205C3B", fontWeight: "bold" }}>Vous êtes ici pour :</Text>
        <View style={{ flexDirection: "row", marginBottom: 16 }}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              userType === "poster" && styles.typeButtonSelected,
            ]}
            onPress={() => setRole("poster")}
          >
            <Text style={{ color: userType === "poster" ? "#fff" : "#205C3B" }}>Poster des offres</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              userType === "chercheur" && styles.typeButtonSelected,
            ]}
            onPress={() => setRole("chercheur")}
          >
            <Text style={{ color: userType === "chercheur" ? "#fff" : "#205C3B" }}>Rechercher un emploi</Text>
          </TouchableOpacity>
        </View>

        {/* Compétences */}
        <TextInput
          style={styles.input}
          placeholder="Vos compétences (ex: React, Node, Design...)"
          placeholderTextColor="#888"
          value={competences}
          onChangeText={setCompetences}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Valider</Text>
          )}
        </TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
          <Text style={{ color: "#333" }}>Déjà un compte ? </Text>
          <Link href="/auth/login" style={{ color: "#205C3B", fontWeight: "bold" }}>Se connecter</Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#205C3B",
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#205C3B",
    color: "#205C3B",
  },
  button: {
    backgroundColor: "#205C3B",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  imageButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#205C3B",
    backgroundColor: "#fff",
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#205C3B",
    marginRight: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  typeButtonSelected: {
    backgroundColor: "#205C3B",
    borderColor: "#205C3B",
  },
});
