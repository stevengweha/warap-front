import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Génère un jobId unique (ex: JOB20240701-xxxx)
function generateJobId() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000);
  return `JOB${y}${m}${d}-${rand}`;
}

const CreateJob = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    titre: "",
    description: "",
    categorie: "",
    localisation: "",
    remuneration: "",
    dateMission: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    console.log("Bouton 'Créer l'offre' cliqué");
    setLoading(true);
    setError(null);
    try {
      // Récupère l'utilisateur connecté pour lier l'offre à son userId
      const userString = await AsyncStorage.getItem("user");
      let userId = null;
      if (userString) {
        const user = JSON.parse(userString);
        userId = user._id || user.id || user.userId;
      }
      if (!userId) {
        setError("Utilisateur non authentifié.");
        setLoading(false);
        return;
      }

      // Génère un jobId unique pour l'offre
      const jobId = generateJobId();

      console.log("Payload envoyé à l'API :", {
        titre: form.titre,
        description: form.description,
        categorie: form.categorie,
        localisation: form.localisation,
        remuneration: form.remuneration,
        dateMission: form.dateMission,
        userId,
        jobId,
      });

      const payload: any = {
        titre: form.titre,
        description: form.description,
        categorie: form.categorie,
        localisation: form.localisation,
        userId, // Obligatoire pour le backend
        jobId,  // Obligatoire pour le backend
      };
      if (form.remuneration) payload.remuneration = Number(form.remuneration);
      if (form.dateMission) payload.dateMission = form.dateMission;

      if (!payload.titre || !payload.description || !payload.categorie || !payload.localisation) {
        setError("Tous les champs obligatoires doivent être remplis.");
        setLoading(false);
        return;
      }

      const res = await fetch("http://192.168.1.115:5001/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      console.log("Status de la réponse:", res.status, "Content-Type:", contentType);

      if (!res.ok) {
        let errMsg = "Erreur lors de la création de l'offre";
        if (contentType.includes("application/json")) {
          try {
            const err = await res.json();
            console.log("Erreur JSON backend:", err);
            errMsg = err.message || err.error || errMsg;
          } catch (e) {
            console.log("Erreur lors du parsing JSON backend", e);
          }
        } else {
          const errText = await res.text();
          console.log("Erreur texte backend:", errText);
          if (errText && errText.length < 200) errMsg = errText;
        }
        throw new Error(errMsg);
      }

      // Succès
      console.log("Offre créée avec succès !");
      router.push("/Jobs/Management");
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.bg}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Créer une offre d'emploi</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Titre du poste</Text>
            <TextInput
              placeholder="Ex: Serveur(se), Développeur..."
              value={form.titre}
              onChangeText={(text) => handleChange("titre", text)}
              style={styles.input}
              placeholderTextColor="#a1a1aa"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Décrivez la mission"
              value={form.description}
              onChangeText={(text) => handleChange("description", text)}
              style={[styles.input, { height: 80 }]}
              multiline
              placeholderTextColor="#a1a1aa"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Catégorie</Text>
            <TextInput
              placeholder="Ex: Restauration, Informatique..."
              value={form.categorie}
              onChangeText={(text) => handleChange("categorie", text)}
              style={styles.input}
              placeholderTextColor="#a1a1aa"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Lieu</Text>
            <TextInput
              placeholder="Ville ou adresse"
              value={form.localisation}
              onChangeText={(text) => handleChange("localisation", text)}
              style={styles.input}
              placeholderTextColor="#a1a1aa"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Rémunération (€)</Text>
            <TextInput
              placeholder="Ex: 100"
              value={form.remuneration}
              onChangeText={(text) => handleChange("remuneration", text)}
              style={styles.input}
              keyboardType="numeric"
              placeholderTextColor="#a1a1aa"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Date de la mission</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              value={form.dateMission}
              onChangeText={(text) => handleChange("dateMission", text)}
              style={styles.input}
              placeholderTextColor="#a1a1aa"
            />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          {loading ? (
            <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 10 }} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Créer l'offre</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 28,
    letterSpacing: 0.5,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 6,
    marginLeft: 2,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#f9fafb",
    fontSize: 16,
    color: "#22223b",
  },
  error: {
    color: "#dc2626",
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#22c55e",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

export default CreateJob;
