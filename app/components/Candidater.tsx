import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Candidater() {
  const { jobId } = useLocalSearchParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://192.168.1.115:5001/api/jobs/${jobId}`);
        if (!res.ok) throw new Error("Erreur lors du chargement de l'offre");
        const data = await res.json();
        setJob(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchJob();
  }, [jobId]);

  useEffect(() => {
    const getUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        setUserId(user._id || user.id || user.userId);
      }
    };
    getUser();
  }, []);

  const handleCandidater = async () => {
    setSending(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("http://192.168.1.115:5001/api/candidatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          chercheurId: userId,
          message,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la candidature");
      setSuccess(true);
      setMessage("");
    } catch (e: any) {
      setError(e.message);
      Alert.alert("Erreur", e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#205C3B" size="large" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#888" }}>Offre introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{job.titre}</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{job.description}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Catégorie</Text>
            <Text style={styles.value}>{job.categorie}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Lieu</Text>
            <Text style={styles.value}>{job.localisation}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Rémunération</Text>
            <Text style={styles.value}>{job.remuneration ? `${job.remuneration} €` : "Non précisée"}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Date mission</Text>
            <Text style={styles.value}>
              {job.dateMission ? new Date(job.dateMission).toLocaleDateString("fr-FR") : "Non définie"}
            </Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Statut</Text>
          <Text style={[
            styles.status,
            job.statut === "Ouvert" ? styles.statusOpen : styles.statusOther
          ]}>
            {job.statut}
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Message au recruteur (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="Votre message..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
            placeholderTextColor="#aaa"
          />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        {success && <Text style={styles.success}>Candidature envoyée !</Text>}
        <TouchableOpacity
          style={[styles.button, (!userId || sending) && styles.buttonDisabled]}
          onPress={handleCandidater}
          disabled={sending || !userId}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{sending ? "Envoi..." : "Candidater"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.link}
          onPress={() => router.back()}
        >
          <Text style={styles.linkText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: "#F7F8F5",
    flexGrow: 1,
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8F5",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#205C3B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 2,
    fontSize: 15,
  },
  value: {
    color: "#333",
    marginBottom: 2,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    minHeight: 48,
    fontSize: 15,
    color: "#205C3B",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#205C3B",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 4,
    shadowColor: "#205C3B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: "#b6c7be",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  error: {
    color: "#dc2626",
    marginBottom: 10,
    textAlign: "center",
  },
  success: {
    color: "#22c55e",
    marginBottom: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  status: {
    fontWeight: "bold",
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  statusOpen: {
    backgroundColor: "#d1fae5",
    color: "#166534",
  },
  statusOther: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  link: {
    alignSelf: "center",
    marginTop: 10,
    padding: 6,
  },
  linkText: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 15,
  },
});
