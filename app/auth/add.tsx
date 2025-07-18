import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Add() {
  const [userType, setRole] = useState<"posteur" | "chercheur" | null>(null);
  const [bio, setBio] = useState("");
  const [competences, setCompetences] = useState("");
  const [photoProfil, setPhotoProfil] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ bio: "", competences: "", photo: "" });
  const router = useRouter();

  const handlePickImage = async () => {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: false,
  });
  if (!res.canceled && res.assets && res.assets.length > 0) {
    const uri = res.assets[0].uri;
    
    // Redimensionner ou compresser l'image
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 500 } }], // Redimensionner à une largeur de 800 pixels
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // Compresser l'image
    );

    setPhotoProfil(manipulatedImage.uri);
  }
};

const getBase64FromUriWeb = (uri: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = reject;
      xhr.open("GET", uri);
      xhr.responseType = "blob";
      xhr.send();
    } catch (e) {
      reject(e);
    }
  });
};

  const handleSubmit = async () => {
    console.log("Bouton Valider cliqué !");
    setErrors({ bio: "", competences: "", photo: "" }); // Reset errors
    if (!userType) {
      setErrors(prev => ({ ...prev, photo: "Veuillez choisir un type d'utilisateur." }));
      return;
    }
    if (!bio) {
      setErrors(prev => ({ ...prev, bio: "Veuillez remplir votre bio." }));
      return;
    }
    if (!competences) {
      setErrors(prev => ({ ...prev, competences: "Veuillez entrer vos compétences." }));
      return;
    }
    if (!photoProfil) {
      setErrors(prev => ({ ...prev, photo: "Veuillez choisir une photo de profil." }));
      return;
    }

    setLoading(true);
    try {
      console.log("Début de la soumission du formulaire...");
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Erreur", "Vous devez être connecté pour compléter votre profil.");
        setLoading(false);
        return;
      }

      let photoBase64 = null;
      if (photoProfil) {
        if (Platform.OS === "web") {
          photoBase64 = await getBase64FromUriWeb(photoProfil);
          // photoBase64 est déjà au format data:image/jpeg;base64,...
        } else {
          const base64 = await FileSystem.readAsStringAsync(photoProfil, { encoding: FileSystem.EncodingType.Base64 });
          photoBase64 = `data:image/jpeg;base64,${base64}`;
        }
      }

      const payload = { 
        role: userType, 
        bio, 
        competences, 
        photoProfil: photoBase64
      };
      console.log("Payload envoyé au backend :", payload);

      const response = await fetch("https://warap-back.onrender.com/api/auth/complete-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        console.log("Erreur backend :", data);
        Alert.alert("Erreur", data.message || "Erreur lors de la complétion du profil.");
        setLoading(false);
        return;
      }
      Alert.alert("Succès", "Profil complété avec succès !");
      if (data.user) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      }
      switch (data.user.role) {
        case "posteur":
          router.replace("/offreur/home-offer");
          break;
        case "chercheur":
          router.replace("/Travailleur/home-user");
          break;
        case "admin":
          router.replace("/Admin/dashboard");
          break;
        default:
          Alert.alert("Erreur", "Rôle inconnu.");
      }
    } catch (error) {
      console.log("Erreur lors de la soumission :", error);
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Ajoutez vos informations</Text>
        <Text style={styles.subtitle}>Finalisez votre inscription</Text>

        {/* Photo de profil */}
        <View style={styles.imageContainer}>
          {photoProfil ? (
            <Image source={{ uri: photoProfil }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.noImage]}>
              <Ionicons name="camera" size={32} color="#aaa" />
            </View>
          )}
          <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
            <Text style={{ color: "#205C3B" }}>Choisir une photo</Text>
          </TouchableOpacity>
          {errors.photo ? <Text style={styles.errorText}>{errors.photo}</Text> : null}
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
        {errors.bio ? <Text style={styles.errorText}>{errors.bio}</Text> : null}

        {/* Type d'utilisateur */}
        <Text style={styles.label}>Vous êtes ici pour :</Text>
        <View style={styles.userTypeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, userType === "posteur" && styles.typeButtonSelected]}
            onPress={() => setRole("posteur")}
          >
            <Text style={{ color: userType === "posteur" ? "#fff" : "#205C3B" }}>Poster des offres</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, userType === "chercheur" && styles.typeButtonSelected]}
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
        {errors.competences ? <Text style={styles.errorText}>{errors.competences}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" style={{ transform: [{ scale: 1.2 }] }} />
          ) : (
            <Text style={styles.buttonText}>Valider</Text>
          )}
        </TouchableOpacity>
        <View style={styles.loginRedirect}>
          <Text style={{ color: "#333" }}>Déjà un compte ? </Text>
          <Link href="/auth/login" style={{ color: "#205C3B", fontWeight: "bold" }}>Se connecter</Link>
        </View>
      </ScrollView>
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
    flexGrow: 1,
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
  noImage: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  imageButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#205C3B",
    backgroundColor: "#fff",
  },
  userTypeContainer: {
    flexDirection: "row",
    marginBottom: 16,
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
  label: {
    marginBottom: 8,
    color: "#205C3B",
    fontWeight: "bold",
  },
  loginRedirect: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  errorText: {
    color: "red",
    marginTop: 4,
    fontSize: 14,
  },
});