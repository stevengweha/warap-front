import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

export default function Register() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirm, setConfirm] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const router = useRouter();

  const validateInputs = () => {
    const nameRegex = /^[a-zA-ZÀ-ÿ' -]{2,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\s\-]{6,20}$/;
    const addressRegex = /^[a-zA-Z0-9À-ÿ'.,\-\/\s]{3,100}$/;

    if (!nameRegex.test(nom.trim())) {
      Alert.alert("Erreur", "Le nom contient des caractères non autorisés.");
      return false;
    }
    if (!nameRegex.test(prenom.trim())) {
      Alert.alert("Erreur", "Le prénom contient des caractères non autorisés.");
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Erreur", "L'email n'est pas valide.");
      return false;
    }
    if (!phoneRegex.test(telephone.trim())) {
      Alert.alert("Erreur", "Le téléphone n'est pas valide.");
      return false;
    }
    if (!addressRegex.test(adresse.trim())) {
      Alert.alert("Erreur", "L'adresse contient des caractères non autorisés.");
      return false;
    }
    if (motDePasse.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
      return false;
    }
    if (motDePasse !== confirm) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return false;
    }
    if (/['"\\;]/.test(motDePasse)) {
      Alert.alert("Erreur", "Le mot de passe contient des caractères non autorisés.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;
    try {
      const response = await fetch("https://warap-back.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          prenom,
          email,
          motDePasse,
          telephone,
          adresse,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Succès", "Compte créé !");
        router.push("/auth/add");
      } else {
        Alert.alert("Erreur", data.message || "Erreur lors de l'inscription");
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de contacter le serveur");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
        <View style={styles.header}>
          <Ionicons name="person-add-outline" size={32} color="#205C3B" style={{ marginRight: 8 }} />
          <Text style={styles.logo}>Inscription</Text>
        </View>
        <View style={styles.container}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Remplissez les champs pour vous inscrire</Text>

          {/* Nom */}
          <View style={[styles.inputContainer, focus === "nom" && styles.inputContainerFocused]}>
            <Text style={[styles.label, (focus === "nom" || nom) && styles.labelFocused]}>Nom</Text>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              onFocus={() => setFocus("nom")}
              onBlur={() => setFocus(null)}
            />
          </View>

          {/* Prénom */}
          <View style={[styles.inputContainer, focus === "prenom" && styles.inputContainerFocused]}>
            <Text style={[styles.label, (focus === "prenom" || prenom) && styles.labelFocused]}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={prenom}
              onChangeText={setPrenom}
              onFocus={() => setFocus("prenom")}
              onBlur={() => setFocus(null)}
            />
          </View>

          {/* Email */}
          <View style={[styles.inputContainer, focus === "email" && styles.inputContainerFocused]}>
            <Text style={[styles.label, (focus === "email" || email) && styles.labelFocused]}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setFocus("email")}
              onBlur={() => setFocus(null)}
            />
          </View>

          {/* Téléphone */}
          <View style={[styles.inputContainer, focus === "telephone" && styles.inputContainerFocused]}>
            <Text style={[styles.label, (focus === "telephone" || telephone) && styles.labelFocused]}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={telephone}
              onChangeText={setTelephone}
              keyboardType="phone-pad"
              onFocus={() => setFocus("telephone")}
              onBlur={() => setFocus(null)}
            />
          </View>

          {/* Adresse */}
          <View style={[styles.inputContainer, focus === "adresse" && styles.inputContainerFocused]}>
            <Text style={[styles.label, (focus === "adresse" || adresse) && styles.labelFocused]}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={adresse}
              onChangeText={setAdresse}
              onFocus={() => setFocus("adresse")}
              onBlur={() => setFocus(null)}
            />
          </View>

          {/* Mot de passe */}
          <View style={[styles.inputContainer, focus === "motDePasse" && styles.inputContainerFocused]}>
            <Text style={[styles.label, (focus === "motDePasse" || motDePasse) && styles.labelFocused]}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={motDePasse}
              onChangeText={setMotDePasse}
              secureTextEntry
              onFocus={() => setFocus("motDePasse")}
              onBlur={() => setFocus(null)}
            />
          </View>

          {/* Confirmation */}
          <View style={[styles.inputContainer, focus === "confirm" && styles.inputContainerFocused]}>
            <Text style={[styles.label, (focus === "confirm" || confirm) && styles.labelFocused]}>
              Confirmer le mot de passe
            </Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              onFocus={() => setFocus("confirm")}
              onBlur={() => setFocus(null)}
            />
          </View>

          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => [
              {
                backgroundColor: pressed ? "#144d2b" : "green",
                padding: 16,
                borderRadius: 8,
                alignItems: "center",
                marginTop: 12,
              },
            ]}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>S'inscrire</Text>
          </Pressable>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
            <Text style={{ color: "#333" }}>Déjà un compte ? </Text>
            <Link href="/auth/login" style={{ color: "#205C3B", fontWeight: "bold" }}>
              Se connecter
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 24,
    paddingBottom: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#205C3B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    position: "relative",
  },
  inputContainerFocused: {
    borderColor: "#205C3B",
    shadowOpacity: 0.15,
  },
  label: {
    position: "absolute",
    left: 18,
    top: 18,
    fontSize: 16,
    color: "#888",
    zIndex: 2,
    backgroundColor: "transparent",
  },
  labelFocused: {
    top: 4,
    fontSize: 13,
    color: "#205C3B",
    fontWeight: "bold",
  },
  input: {
    fontSize: 16,
    color: "#205C3B",
    paddingVertical: 4,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    marginTop: 10,
  },
});
