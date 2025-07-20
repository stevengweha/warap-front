import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomTabBar from "../components/BottomTabBar";

type User = {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role?: string;
  photoProfil?: string;
};

type Job = {
  _id: string;
  jobId: string;
  titre: string;
  description: string;
  categorie: string;
  localisation: string;
  dateMission?: string;
  statut: string;
  remuneration?: number;
  userId: User | string;
};

type Candidature = {
  _id: string;
  chercheurId: User;
  jobId: Job;
  dateCandidature: string;
  statut: "en_attente" | "acceptee" | "refusee";
  message?: string;
};

export default function JobControlCenter() {
  const { jobId, candidatId } = useLocalSearchParams();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [candidat, setCandidat] = useState<User | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          const user = JSON.parse(userString);
          const normalizedUser = {
            ...user,
            _id: user.id || user._id,
          };
          setCurrentUser(normalizedUser);
        }
      } catch (error) {
        console.error("[ERROR] Erreur récupération utilisateur :", error);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const jobRes = await fetch(`https://warap-back.onrender.com/api/jobs/${jobId}`);
        const jobData = await jobRes.json();
        setJob(jobData);

        const candRes = await fetch("https://warap-back.onrender.com/api/candidatures");
        const allCands: Candidature[] = await candRes.json();
        const jobCands = allCands.filter((c) => c.jobId?._id === jobId);
        setCandidatures(jobCands);

        const selected = jobCands.find((c) => c.chercheurId?._id === candidatId);
        setCandidat(selected?.chercheurId || null);
      } catch (e) {
        setJob(null);
        setCandidat(null);
        setCandidatures([]);
      } finally {
        setLoading(false);
      }
    };
    if (jobId && candidatId) fetchData();
  }, [jobId, candidatId]);

  const getRole = () => {
    if (!currentUser || !job) return "invite";
    if (currentUser.role === "admin") return "admin";
    if (currentUser._id === (typeof job.userId === "string" ? job.userId : job.userId?._id)) return "posteur";
    if (currentUser._id === candidatId) return "chercheur";
    return "invite";
  };

  const role = getRole();

  const handleUpdateStatut = async (candidatureId: string, statut: "acceptee" | "refusee") => {
    try {
      const res = await fetch(`https://warap-back.onrender.com/api/candidatures/${candidatureId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      await router.replace({
        pathname: "/Jobs/JobControlCenter",
        params: { jobId, candidatId },
      });
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  const openEditModal = () => {
    setEditJob(job ? { ...job } : null);
    setEditModalVisible(true);
  };

  const handleEditJob = async () => {
    if (!editJob) return;
    setEditLoading(true);
    try {
      const res = await fetch(`https://warap-back.onrender.com/api/jobs/${editJob._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: editJob.titre,
          description: editJob.description,
          categorie: editJob.categorie,
          localisation: editJob.localisation,
          remuneration: editJob.remuneration,
          dateMission: editJob.dateMission,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la modification du job");
      const updated = await res.json();
      setJob(updated);
      setEditModalVisible(false);
      Alert.alert("Succès", "Offre modifiée !");
    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Impossible de modifier le job.");
    } finally {
      setEditLoading(false);
    }
  };

  const acceptedCandidatures = candidatures.filter((c) => c.statut === "acceptee");
  const selectedCandidature = candidatures.find((c) => c.chercheurId?._id === candidatId);

  const handleTerminateJob = async () => {
    try {
      const res = await fetch(`https://warap-back.onrender.com/api/jobs/${job?._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression du job");
      Alert.alert("Succès", "Le job a été terminé et supprimé.");
      router.push("/Jobs");
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#205C3B" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8F5" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <Text style={styles.title}>Centre de contrôle du job</Text>

        {/* Carte Offre */}
        {job && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.jobTitle}>{job.titre}</Text>
              <Text
                style={[
                  styles.status,
                  job.statut === "actif" ? styles.statusActive : styles.statusInactive,
                ]}
              >
                {job.statut.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.label}>
              Catégorie : <Text style={styles.value}>{job.categorie}</Text>
            </Text>
            <Text style={styles.label}>
              Lieu : <Text style={styles.value}>{job.localisation}</Text>
            </Text>
            <Text style={styles.label}>
              Description : <Text style={styles.value}>{job.description}</Text>
            </Text>
            {job.remuneration && (
              <Text style={styles.label}>
                Rémunération : <Text style={styles.value}>{job.remuneration} €</Text>
              </Text>
            )}
            {job.dateMission && (
              <Text style={styles.label}>
                Date mission : <Text style={styles.value}>{job.dateMission}</Text>
              </Text>
            )}

            {role === "posteur" && (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.btnEdit} onPress={openEditModal}>
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnTerminate} onPress={handleTerminateJob}>
                  <Text style={styles.btnText}>Terminer le job</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Liste des candidatures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Candidatures</Text>
          {candidatures.length === 0 && <Text>Aucune candidature reçue.</Text>}

          {/* Posteur: liste détaillée */}
          {role === "posteur" &&
            candidatures.map((cand) => (
              <View
                key={cand._id}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  backgroundColor: "#e3e9e2",
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontWeight: "bold" }}>
                  {cand.chercheurId.prenom} {cand.chercheurId.nom}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                  Statut :{" "}
                  <Text
                    style={{
                      color:
                        cand.statut === "acceptee"
                          ? "green"
                          : cand.statut === "refusee"
                          ? "red"
                          : "#7a7a7a",
                    }}
                  >
                    {cand.statut === "acceptee"
                      ? "Acceptée"
                      : cand.statut === "refusee"
                      ? "Refusée"
                      : "En attente"}
                  </Text>
                </Text>
                <Text>Message : {cand.message || "Aucun"}</Text>
              </View>
            ))}

          {/* Chercheur : sa candidature uniquement */}
          {role === "chercheur" && selectedCandidature && (
            <View
              style={{
                padding: 12,
                backgroundColor: "#e3e9e2",
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontWeight: "bold" }}>
                Candidature pour : {job?.titre}
              </Text>
              <Text>
                Statut :{" "}
                <Text
                  style={{
                    color:
                      selectedCandidature.statut === "acceptee"
                        ? "green"
                        : selectedCandidature.statut === "refusee"
                        ? "red"
                        : "#7a7a7a",
                  }}
                >
                  {selectedCandidature.statut === "acceptee"
                    ? "Acceptée"
                    : selectedCandidature.statut === "refusee"
                    ? "Refusée"
                    : "En attente"}
                </Text>
              </Text>
              <Text>Message : {selectedCandidature.message || "Aucun"}</Text>

              {selectedCandidature.statut === "en_attente" && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#ef4444", marginTop: 12 }]}
                  onPress={() => handleUpdateStatut(selectedCandidature._id, "refusee")}
                >
                  <Text style={styles.actionText}>Retirer ma candidature</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Posteur : accepter/refuser candidature sélectionnée */}
        {role === "posteur" && selectedCandidature && selectedCandidature.statut === "en_attente" && (
          <View style={[styles.row, { marginTop: 12 }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#22c55e", marginRight: 12 }]}
              onPress={() => handleUpdateStatut(selectedCandidature._id, "acceptee")}
            >
              <Text style={styles.actionText}>Accepter cette candidature</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
              onPress={() => handleUpdateStatut(selectedCandidature._id, "refusee")}
            >
              <Text style={styles.actionText}>Refuser cette candidature</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Candidatures acceptées */}
        {acceptedCandidatures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Candidatures acceptées</Text>
            {acceptedCandidatures.map((cand) => (
              <View
                key={cand._id}
                style={{
                  padding: 12,
                  backgroundColor: "#d2f4dc",
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontWeight: "bold" }}>
                  {cand.chercheurId.prenom} {cand.chercheurId.nom}
                </Text>
                <Text>Message : {cand.message || "Aucun"}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal édition job */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Modifier l'offre</Text>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Titre"
                value={editJob?.titre}
                onChangeText={(text) =>
                  setEditJob((prev) => (prev ? { ...prev, titre: text } : null))
                }
              />
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Description"
                multiline
                value={editJob?.description}
                onChangeText={(text) =>
                  setEditJob((prev) => (prev ? { ...prev, description: text } : null))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Catégorie"
                value={editJob?.categorie}
                onChangeText={(text) =>
                  setEditJob((prev) => (prev ? { ...prev, categorie: text } : null))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Localisation"
                value={editJob?.localisation}
                onChangeText={(text) =>
                  setEditJob((prev) => (prev ? { ...prev, localisation: text } : null))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Rémunération (€)"
                keyboardType="numeric"
                value={editJob?.remuneration?.toString() || ""}
                onChangeText={(text) =>
                  setEditJob((prev) => (prev ? { ...prev, remuneration: Number(text) } : null))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Date mission (YYYY-MM-DD)"
                value={editJob?.dateMission || ""}
                onChangeText={(text) =>
                  setEditJob((prev) => (prev ? { ...prev, dateMission: text } : null))
                }
              />
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  style={[styles.actionBtn, { backgroundColor: "#6b7280", flex: 1, marginRight: 8 }]}
                  disabled={editLoading}
                >
                  <Text style={styles.actionText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleEditJob}
                  style={[styles.actionBtn, { backgroundColor: "#22c55e", flex: 1 }]}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#205C3B",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#205C3B",
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#205C3B",
    flex: 1,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },
  value: {
    fontWeight: "normal",
  },
  actionBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  status: {
    fontWeight: "bold",
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  statusActive: {
    backgroundColor: "#22c55e",
    color: "#fff",
  },
  statusInactive: {
    backgroundColor: "#ef4444",
    color: "#fff",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  btnEdit: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  btnTerminate: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "#000000AA",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#205C3B",
  },
});