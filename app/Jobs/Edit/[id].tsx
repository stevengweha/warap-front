import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TextInput } from "react-native";

const EditJob = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params?.id as string;
  const [form, setForm] = useState({
    titre: "",
    description: "",
    categorie: "",
    localisation: "",
    remuneration: "",
    dateMission: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`https://warap-back.onrender.com/api/jobs/${id}`);
        if (!res.ok) throw new Error("Erreur lors du chargement de l'offre");
        const data = await res.json();
        setForm({
          titre: data.titre || "",
          description: data.description || "",
          categorie: data.categorie || "",
          localisation: data.localisation || "",
          remuneration: data.remuneration ? String(data.remuneration) : "",
          dateMission: data.dateMission ? data.dateMission.slice(0, 10) : "",
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id]);

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const payload = {
        ...form,
        remuneration: form.remuneration ? Number(form.remuneration) : undefined,
        dateMission: form.dateMission ? new Date(form.dateMission) : undefined,
      };
      const res = await fetch(`https://warap-back.onrender.com/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      router.push("/Jobs/Management");
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Erreur", err.message);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Modifier l'offre</Text>
      <TextInput
        placeholder="Titre du poste"
        value={form.titre}
        onChangeText={(text) => handleChange("titre", text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Description"
        value={form.description}
        onChangeText={(text) => handleChange("description", text)}
        style={[styles.input, { height: 80 }]}
        multiline
      />
      <TextInput
        placeholder="Catégorie"
        value={form.categorie}
        onChangeText={(text) => handleChange("categorie", text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Lieu"
        value={form.localisation}
        onChangeText={(text) => handleChange("localisation", text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Rémunération (€)"
        value={form.remuneration}
        onChangeText={(text) => handleChange("remuneration", text)}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Date de la mission (YYYY-MM-DD)"
        value={form.dateMission}
        onChangeText={(text) => handleChange("dateMission", text)}
        style={styles.input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Enregistrer" onPress={handleSubmit} color="#2563eb" />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  error: {
    color: "#dc2626",
    marginBottom: 16,
  },
});

export default EditJob;
