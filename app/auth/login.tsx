import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Fonction d'alerte compatible Web & Mobile
const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [motDePasse, setmotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // État pour les erreurs
  const router = useRouter();

  const handleLogin = async () => {
    setErrorMessage(null); // Réinitialiser le message d'erreur
    if (!email || !motDePasse) {
      setErrorMessage("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://warap-back.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "Email ou mot de passe incorrect.");
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("LOGIN - Données utilisateur reçues :", data.user);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      }

      switch (data.user.role) {
        case "posteur":
          router.push("/offreur/home-offer");
          break;
        case "chercheur":
          router.push("/Travailleur/home-user");
          break;
        case "admin":
          router.push("/Admin/dashboard");
          break;
        default:
          setErrorMessage("Rôle inconnu.");
      }
    } catch (e) {
      setErrorMessage("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={32} color="#205C3B" style={{ marginRight: 8 }} />
        <Text style={styles.logo}>Connexion</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Bienvenue !</Text>
        <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#888"
          value={motDePasse}
          onChangeText={setmotDePasse}
          secureTextEntry
        />
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>} {/* Affichage de l'erreur */}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
          <Text style={{ color: "#333" }}>Pas de compte ? </Text>
          <Link href="/auth/register" style={{ color: "#205C3B", fontWeight: "bold" }}>S'inscrire</Link>
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
  errorText: {
    color: "#c00", // Couleur rouge pour les erreurs
    marginBottom: 16,
  },
});