import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Register() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirm, setConfirm] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const router = useRouter();

  const validateInputs = () => {
    const nameRegex = /^[a-zA-ZÀ-ÿ' -]{2,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\s\-]{6,20}$/;
    const addressRegex = /^[a-zA-Z0-9À-ÿ'.,\-\/\s]{3,100}$/;

    if (!nameRegex.test(nom.trim())) {
      Alert.alert("Erreur", "Le nom est invalide.");
      return false;
    }
    if (!nameRegex.test(prenom.trim())) {
      Alert.alert("Erreur", "Le prénom est invalide.");
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Erreur", "Email invalide.");
      return false;
    }
    if (!phoneRegex.test(telephone.trim())) {
      Alert.alert("Erreur", "Téléphone invalide.");
      return false;
    }
    if (!addressRegex.test(adresse.trim())) {
      Alert.alert("Erreur", "Adresse invalide.");
      return false;
    }
    if (motDePasse.length < 6) {
      Alert.alert("Erreur", "Mot de passe trop court.");
      return false;
    }
    if (motDePasse !== confirm) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    console.log("handleRegister appelé"); // Vérifie si la fonction est appelée
    if (!validateInputs()) {
        console.log("Validation échouée");
        return;
    }

    try {
        console.log("Préparation de la requête d'inscription");
        const response = await fetch("https://warap-back.onrender.com/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json",  },
            body: JSON.stringify({
                nom,
                prenom,
                email,
                motDePasse,
                telephone,
                adresse,
            }),
        });

        console.log("Statut de la réponse :", response.status);
        const data = await response.json();
        console.log("Données reçues :", data);

        if (response.ok) {
          // stockage le token si nécessaire
             await AsyncStorage.setItem("token", data.token); // Si tu utilises un token
             await AsyncStorage.setItem("user", JSON.stringify(data.user)); // Si tu veux stocker l'utilisateur
            Alert.alert("Succès", "Compte créé avec succès !");
            router.push("/auth/add");
        } else {
            Alert.alert("Erreur", data.message || "Échec de l'inscription.");
        }
    } catch (error) {
        console.error("Erreur lors de la requête :", error);
    }
};

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="person-add-outline" size={32} color="#205C3B" style={{ marginRight: 8 }} />
          <Text style={styles.logo}>Inscription</Text>
        </View>
        <View style={styles.container}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Veuillez remplir tous les champs</Text>

          <TextInput style={styles.input} placeholder="Nom" value={nom} onChangeText={setNom} />
          <TextInput style={styles.input} placeholder="Prénom" value={prenom} onChangeText={setPrenom} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Téléphone"
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Adresse"
            value={adresse}
            onChangeText={setAdresse}
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>S'inscrire</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
            <Text style={{ color: "#333" }}>Déjà un compte ? </Text>
            <Text
              style={{ color: "#205C3B", fontWeight: "bold" }}
              onPress={() => router.push("/auth/login")}
            >
              Se connecter
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F8F5",
  },
  scroll: {
    paddingBottom: 40,
  },
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
    paddingHorizontal: 24,
    paddingTop: 16,
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
});