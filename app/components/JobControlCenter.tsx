import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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

  // Récupère l'utilisateur courant
  useEffect(() => {
    const getUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        setCurrentUser(user);
      }
    };
    getUser();
  }, []);

  // Récupère le job, le candidat sélectionné et toutes les candidatures pour ce job
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Job
        const jobRes = await fetch(`https://warap-back.onrender.com/api/jobs/${jobId}`);
        const jobData = await jobRes.json();
        setJob(jobData);

        // Toutes les candidatures pour ce job
        const candRes = await fetch("https://warap-back.onrender.com/api/candidatures");
        const allCands: Candidature[] = await candRes.json();
        const jobCands = allCands.filter(c => c.jobId?._id === jobId);
        setCandidatures(jobCands);

        // Candidat sélectionné
        const selected = jobCands.find(c => c.chercheurId?._id === candidatId);
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

  // Détermine le rôle de l'utilisateur courant
  const getRole = () => {
    if (!currentUser || !job) return "invite";
    if (currentUser.role === "admin") return "admin";
    if (currentUser._id === (typeof job.userId === "string" ? job.userId : job.userId?._id)) return "posteur";
    if (currentUser._id === candidatId) return "chercheur";
    return "invite";
  };

  const role = getRole();

  // Actions pour le posteur
  const renderPosteurActions = () => {
    const selectedCand = candidatures.find(c => c.chercheurId?._id === candidatId);
    return (
      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Actions posteur</Text>
        {selectedCand && selectedCand.statut === "en_attente" && (
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#22c55e" }]}
              onPress={() => handleUpdateStatut(selectedCand._id, "acceptee")}
            >
              <Text style={styles.actionText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
              onPress={() => handleUpdateStatut(selectedCand._id, "refusee")}
            >
              <Text style={styles.actionText}>Refuser</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#2563eb", marginTop: 8 }]}
          onPress={() =>
            router.push({
              pathname: "/messages/chat",
              params: {
                senderId: candidatId,
                jobId: job?._id,
              },
            })
          }
        >
          <Text style={styles.actionText}>Contacter le candidat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#2563eb", marginTop: 8 }]}
          onPress={openEditModal}
        >
          <Text style={styles.actionText}>Modifier l'offre</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Actions pour le chercheur
  const renderChercheurActions = () => (
    <View style={styles.actions}>
      <Text style={styles.sectionTitle}>Actions chercheur</Text>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: "#2563eb" }]}
        onPress={() =>
          router.push({
            pathname: "/messages/chat",
            params: {
              senderId: job?.userId && typeof job.userId === "object" ? job.userId._id : job?.userId,
              jobId: job?._id,
            },
          })
        }
      >
        <Text style={styles.actionText}>Contacter le posteur</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: "#ef4444", marginTop: 8 }]}
        onPress={() => Alert.alert("Retrait", "Fonction à implémenter (retirer sa candidature)")}
      >
        <Text style={styles.actionText}>Retirer ma candidature</Text>
      </TouchableOpacity>
    </View>
  );

  // Détermine les actions à afficher selon le rôle
  const renderActions = () => {
    if (role === "posteur") {
      return renderPosteurActions();
    }
    if (role === "chercheur") {
      return renderChercheurActions();
    }
    if (role === "admin") {
      return (
        <View style={styles.actions}>
          <Text style={styles.sectionTitle}>Actions admin</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
            onPress={() => Alert.alert("Suppression", "Fonction à implémenter (supprimer le job ou la candidature)")}
          >
            <Text style={styles.actionText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  // Met à jour le statut d'une candidature (posteur)
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

  // Fonction pour ouvrir le popup d'édition
  const openEditModal = () => {
    setEditJob(job ? { ...job } : null);
    setEditModalVisible(true);
  };

  // Fonction pour enregistrer les modifications
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#205C3B" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8F5", padding: 16 }}>
      <Text style={styles.title}>Centre de contrôle du job</Text>
      {/* Infos du job */}
      {job && (
        <View style={styles.section}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.sectionTitle}>Offre</Text>
            {/* Bouton Edit visible seulement pour le posteur */}
            {role === "posteur" && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#2563eb",
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
                onPress={openEditModal}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.jobTitle}>{job.titre}</Text>
          <Text style={styles.label}>Catégorie : <Text style={styles.value}>{job.categorie}</Text></Text>
          <Text style={styles.label}>Lieu : <Text style={styles.value}>{job.localisation}</Text></Text>
          <Text style={styles.label}>Date mission : <Text style={styles.value}>{job.dateMission ? new Date(job.dateMission).toLocaleDateString("fr-FR") : "Non définie"}</Text></Text>
          <Text style={styles.label}>Statut : <Text style={styles.value}>{job.statut}</Text></Text>
          <Text style={styles.label}>Rémunération : <Text style={styles.value}>{job.remuneration ? `${job.remuneration} €` : "Non précisée"}</Text></Text>
        </View>
      )}

      {/* Infos du candidat sélectionné */}
      {candidat && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Candidat sélectionné</Text>
          <Text style={styles.label}>Nom : <Text style={styles.value}>{candidat.prenom} {candidat.nom}</Text></Text>
          <Text style={styles.label}>Email : <Text style={styles.value}>{candidat.email}</Text></Text>
        </View>
      )}

      {/* Affichage dynamique selon le rôle */}
      {role === "posteur" && renderPosteurActions()}
      {role === "chercheur" && renderChercheurActions()}
      {role === "admin" && (
        <View style={styles.actions}>
          <Text style={styles.sectionTitle}>Actions admin</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
            onPress={() => Alert.alert("Suppression", "Fonction à implémenter (supprimer le job ou la candidature)")}
          >
            <Text style={styles.actionText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Historique des candidatures pour ce job */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Toutes les candidatures pour ce job</Text>
        <FlatList
          data={candidatures}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={[
              styles.candCard,
              item.chercheurId?._id === candidatId ? styles.candCardSelected : null
            ]}>
              <Text style={styles.candName}>{item.chercheurId?.prenom} {item.chercheurId?.nom}</Text>
              <Text style={styles.candStatut}>
                Statut : <Text style={{
                  color:
                    item.statut === "acceptee"
                      ? "#22c55e"
                      : item.statut === "refusee"
                      ? "#ef4444"
                      : "#f59e42"
                }}>{item.statut}</Text>
              </Text>
              <Text style={styles.candDate}>
                {item.dateCandidature ? new Date(item.dateCandidature).toLocaleDateString("fr-FR") : ""}
              </Text>
              {item.message && (
                <Text style={styles.candMsg}>Message : {item.message}</Text>
              )}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={{ color: "#888", textAlign: "center", marginTop: 12 }}>
              Aucune candidature pour ce job.
            </Text>
          }
        />
      </View>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backBtnText}>Retour</Text>
      </TouchableOpacity>

      {/* Modal d'édition rapide du job */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.18)",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}>
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 18,
            width: "100%",
            maxWidth: 400,
            padding: 18,
            elevation: 6,
          }}>
            <Text style={{ fontWeight: "bold", fontSize: 18, color: "#205C3B", marginBottom: 12 }}>Modifier l'offre</Text>
            <TextInput
              style={styles.input}
              value={editJob?.titre || ""}
              onChangeText={v => setEditJob(e => e ? { ...e, titre: v } : e)}
              placeholder="Titre"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              value={editJob?.categorie || ""}
              onChangeText={v => setEditJob(e => e ? { ...e, categorie: v } : e)}
              placeholder="Catégorie"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              value={editJob?.localisation || ""}
              onChangeText={v => setEditJob(e => e ? { ...e, localisation: v } : e)}
              placeholder="Lieu"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              value={editJob?.remuneration ? String(editJob.remuneration) : ""}
              onChangeText={v => setEditJob(e => e ? { ...e, remuneration: Number(v) } : e)}
              placeholder="Rémunération"
              keyboardType="numeric"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={styles.input}
              value={editJob?.dateMission ? String(editJob.dateMission).substring(0, 10) : ""}
              onChangeText={v => setEditJob(e => e ? { ...e, dateMission: v } : e)}
              placeholder="Date mission (YYYY-MM-DD)"
              placeholderTextColor="#aaa"
            />
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              value={editJob?.description || ""}
              onChangeText={v => setEditJob(e => e ? { ...e, description: v } : e)}
              placeholder="Description"
              multiline
              placeholderTextColor="#aaa"
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#205C3B", flex: 1 }]}
                onPress={handleEditJob}
                disabled={editLoading}
              >
                <Text style={styles.actionText}>{editLoading ? "Enregistrement..." : "Enregistrer"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#ef4444", flex: 1 }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.actionText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 12,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#2563eb",
    fontSize: 16,
    marginBottom: 6,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 4,
  },
  label: {
    color: "#205C3B",
    fontWeight: "600",
    fontSize: 14,
    marginTop: 2,
  },
  value: {
    color: "#333",
    fontWeight: "normal",
  },
  actions: {
    marginBottom: 18,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 2,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  candCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  candCardSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#e0f2fe",
  },
  candName: {
    fontWeight: "bold",
    color: "#205C3B",
    fontSize: 15,
  },
  candStatut: {
    fontSize: 14,
    marginBottom: 2,
  },
  candDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 2,
  },
  candMsg: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },
  backBtn: {
    alignSelf: "center",
    marginTop: 8,
    backgroundColor: "#205C3B",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8F5",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    fontSize: 16,
    color: "#333",
  },
});
