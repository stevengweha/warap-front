import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function CandidatureDetail() {
  const { candidatureId } = useLocalSearchParams();
  const router = useRouter();
  const [candidature, setCandidature] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCandidature = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://warap-back.onrender.com/api/candidatures/${candidatureId}`);
        const data = await res.json();
        setCandidature(data);
        setMessage(data.message || "");
      } catch {
        setCandidature(null);
      } finally {
        setLoading(false);
      }
    };
    if (candidatureId) fetchCandidature();
    console.log("Candidature ID reçu :", candidatureId);

  }, [candidatureId]);

  const handleSave = async () => {
    console.log("Enregistrer candidature", { candidatureId, message });
    setSaving(true);
    try {
      // Utilise PUT au lieu de PATCH pour correspondre à l'API backend
      const res = await fetch(`https://warap-back.onrender.com/api/candidatures/${candidatureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          try {
            const err = await res.json();
            throw new Error(err.message || "Erreur lors de la modification");
          } catch {
            throw new Error("Erreur lors de la modification (réponse JSON invalide)");
          }
        } else {
          throw new Error("Erreur serveur : réponse inattendue (HTML reçu). Vérifiez l'API.");
        }
      }
      if (!contentType.includes("application/json")) {
        throw new Error("Erreur serveur : réponse inattendue (HTML reçu). Vérifiez l'API.");
      }
      let updated;
      try {
        updated = await res.json();
      } catch {
        throw new Error("Erreur lors de la lecture de la réponse JSON.");
      }
      setCandidature(updated);
      setEditMode(false);
      Alert.alert("Succès", "Message modifié !");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible de modifier la candidature.");
    } finally {
      setSaving(false);
    }
  };

 const handleDelete = async () => {
  console.log("🔥 Suppression directe test");

  try {
    const res = await fetch(`https://warap-back.onrender.com/api/candidatures/${candidatureId}`, {
      method: "DELETE",
    });

    const txt = await res.text();
    console.log("✅ Résultat suppression :", res.status, txt);

    if (!res.ok) throw new Error(txt);

    Alert.alert("Succès", "Suppression réussie !");
    router.back();
  } catch (e: any) {
    console.error("❌ Erreur suppression :", e.message);
    Alert.alert("Erreur", e.message);
  }
};



  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#205C3B" /></View>;
  }
  if (!candidature) {
    return <View style={styles.center}><Text style={{ color: "#888" }}>Candidature introuvable.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Détail de la candidature</Text>
      <Text style={styles.label}>Offre :</Text>
      <Text style={styles.value}>{candidature.jobId?.titre || "Offre inconnue"}</Text>
      <Text style={styles.label}>Statut :</Text>
      <Text style={styles.value}>{candidature.statut}</Text>
      <Text style={styles.label}>Date :</Text>
      <Text style={styles.value}>{candidature.dateCandidature ? new Date(candidature.dateCandidature).toLocaleDateString("fr-FR") : ""}</Text>
      <Text style={styles.label}>Message :</Text>
      {editMode ? (
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          multiline
        />
      ) : (
        <Text style={styles.value}>{candidature.message || <Text style={{ color: "#888" }}>Aucun message</Text>}</Text>
      )}
      <View style={{ flexDirection: "row", marginTop: 18, gap: 12, justifyContent: "center" }}>
        {/* Affiche le bouton centre de contrôle à côté des actions */}
        {candidature.statut === "acceptee" && (
          <TouchableOpacity
            style={{
              backgroundColor: "#2563eb",
              borderRadius: 8,
              paddingHorizontal: 18,
              paddingVertical: 10,
              marginRight: 8,
              alignSelf: "center",
            }}
            onPress={() =>
              router.push({
                pathname: "/components/JobControlCenter",
                params: {
                  jobId: candidature?.jobId?._id,
                  candidatId: candidature?.chercheurId?._id,
                },
              })
            }
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Voir le centre de contrôle</Text>
          </TouchableOpacity>
        )}
        {/* Désactive modification/suppression si acceptée */}
        {candidature.statut !== "acceptee" && (
          editMode ? (
            <>
              <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
                <Text style={styles.buttonText}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={() => setEditMode(false)}>
                <Text style={[styles.buttonText, { color: "#205C3B" }]}>Annuler</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  console.log("Modifier candidature", candidature);
                  setEditMode(true);
                }}
              >
                <Text style={styles.buttonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonDelete]} onPress={handleDelete}>
                <Text style={[styles.buttonText, { color: "#fff" }]}>Supprimer</Text>
              </TouchableOpacity>
            </>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8F5", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7F8F5" },
  title: { fontSize: 22, fontWeight: "bold", color: "#205C3B", marginBottom: 18, textAlign: "center" },
  label: { fontWeight: "bold", color: "#205C3B", marginTop: 10, marginBottom: 2 },
  value: { color: "#333", marginBottom: 2, fontSize: 15 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10, backgroundColor: "#fff", minHeight: 48, fontSize: 15, color: "#205C3B" },
  button: { backgroundColor: "#205C3B", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  buttonCancel: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#205C3B" },
  buttonDelete: { backgroundColor: "#ef4444" },
});
