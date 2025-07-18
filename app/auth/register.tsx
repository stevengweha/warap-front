import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ Fonction d'alerte compatible Web & Mobile
const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function Register() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirm, setConfirm] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const validateInputs = () => {
    const nameRegex = /^[a-zA-ZÀ-ÿ' -]{2,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\s\-]{6,20}$/;
    const addressRegex = /^[a-zA-Z0-9À-ÿ'.,\-\/\s]{3,100}$/;
    const newErrors = {};

    if (!nameRegex.test(nom.trim())) {
      newErrors.nom = "Le nom est invalide.";
    }
    if (!nameRegex.test(prenom.trim())) {
      newErrors.prenom = "Le prénom est invalide.";
    }
    if (!emailRegex.test(email.trim())) {
      newErrors.email = "Email invalide.";
    }
    if (!phoneRegex.test(telephone.trim())) {
      newErrors.telephone = "Téléphone invalide.";
    }
    if (!addressRegex.test(adresse.trim())) {
      newErrors.adresse = "Adresse invalide.";
    }
    if (motDePasse.length < 6) {
      newErrors.motDePasse = "Mot de passe trop court.";
    }
    if (motDePasse !== confirm) {
      newErrors.confirm = "Les mots de passe ne correspondent pas.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
  if (!validateInputs()) return;

  setLoading(true);
  setErrors((prev) => ({ ...prev, email: null }));

  try {
    const response = await fetch("https://warap-back.onrender.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, prenom, email, motDePasse, telephone, adresse }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.message && data.message.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: "Cet email est déjà utilisé." }));
      } else {
        showAlert("Erreur", data.message || "Échec de l'inscription.");
      }
      setLoading(false);
      return;
    }

    // Succès
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    router.push("/auth/add");
  } catch (error) {
    console.error("Erreur lors de la requête :", error);
    showAlert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
  } finally {
    setLoading(false);
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
          {errors.nom && <Text style={styles.error}>{errors.nom}</Text>}

          <TextInput style={styles.input} placeholder="Prénom" value={prenom} onChangeText={setPrenom} />
          {errors.prenom && <Text style={styles.error}>{errors.prenom}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Téléphone"
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
          />
          {errors.telephone && <Text style={styles.error}>{errors.telephone}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Adresse"
            value={adresse}
            onChangeText={setAdresse}
          />
          {errors.adresse && <Text style={styles.error}>{errors.adresse}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={motDePasse}
            onChangeText={setMotDePasse}
            secureTextEntry
          />
          {errors.motDePasse && <Text style={styles.error}>{errors.motDePasse}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
          {errors.confirm && <Text style={styles.error}>{errors.confirm}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" /> // Indicateur de chargement
            ) : (
              <Text style={styles.buttonText}>S'inscrire</Text>
            )}
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
  error: {
    color: "red",
    fontSize: 14,
    marginBottom: 8,
  },
});