import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [motDePasse, setmotDePasse] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          switch (user.role) {
            case "posteur":
              router.replace("/offreur/home-offer");
              return;
            case "chercheur":
              router.replace("/Travailleur/home-user");
              return;
            case "admin":
              router.replace("/Admin/dashboard");
              return;
            default:
              await AsyncStorage.removeItem("user");
          }
        } catch {
          await AsyncStorage.removeItem("user");
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleLogin = async () => {
    if (!email || !motDePasse) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    setLoginLoading(true);
    try {
      const response = await fetch("https://warap-back.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Erreur", data.message || "Email ou mot de passe incorrect.");
        setLoginLoading(false);
        return;
      }
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
    } catch (e) {
      Alert.alert("Erreur", "Impossible de contacter le serveur.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#205C3B" />
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loginLoading}>
          {loginLoading ? (
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
});
