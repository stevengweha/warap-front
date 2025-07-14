import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Job = {
  _id: string;
  titre: string;
  statut: string;
  dateMission?: string;
  localisation?: string;
};

type Candidature = {
  _id: string;
  jobId: Job;
  statut: string;
  dateCandidature: string;
};

export default function JobHistory() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        setCurrentUserId(user._id || user.id || null);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Récupère toutes les candidatures de l'utilisateur
        const res = await fetch("https://warap-back.onrender.com/api/candidatures");
        const data: Candidature[] = await res.json();
        // Filtre : candidatures de l'utilisateur ET job terminé
        const filtered = data.filter(
          c =>
            c.jobId &&
            c.jobId._id &&
            c.statut === "acceptee" &&
            c.jobId.statut &&
            ["termine", "terminé", "fini", "completed", "done"].includes(
              c.jobId.statut.toLowerCase()
            ) &&
            c.chercheurId &&
            (c.chercheurId._id === currentUserId)
        );
        // On ne garde que les jobs (évite les doublons)
        const jobsDone: Job[] = [];
        const seen = new Set();
        for (const c of filtered) {
          if (!seen.has(c.jobId._id)) {
            jobsDone.push(c.jobId);
            seen.add(c.jobId._id);
          }
        }
        setJobs(jobsDone);
      } catch (e) {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    if (currentUserId) fetchHistory();
  }, [currentUserId]);

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>Historique des jobs terminés</Text>
      {loading ? (
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.jobTitle}>{item.titre}</Text>
              <Text style={styles.status}>Statut : <Text style={{ color: "#22c55e" }}>{item.statut}</Text></Text>
              {item.dateMission && (
                <Text style={styles.date}>
                  Mission du : {new Date(item.dateMission).toLocaleDateString("fr-FR")}
                </Text>
              )}
              {item.localisation && (
                <Text style={styles.localisation}>Lieu : {item.localisation}</Text>
              )}
            </View>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 32 }}>
              <Text style={{ color: "#888", textAlign: "center", marginBottom: 12 }}>
                Aucun job terminé trouvé. Veuillez participer à des missions !
              </Text>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => router.push("/Travailleur/home-user")}
              >
                <Text style={styles.linkText}>Voir les missions disponibles</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      {/* Bouton flottant pour ouvrir l'historique dans une modale */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowHistory(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>🕓</Text>
      </TouchableOpacity>
      <Modal
        visible={showHistory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowHistory(false)}
            >
              <Text style={{ fontSize: 22, color: "#205C3B" }}>✕</Text>
            </TouchableOpacity>
            {/* Réutilise le composant pour afficher l'historique dans la modale */}
            <FlatList
              data={jobs}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.jobTitle}>{item.titre}</Text>
                  <Text style={styles.status}>Statut : <Text style={{ color: "#22c55e" }}>{item.statut}</Text></Text>
                  {item.dateMission && (
                    <Text style={styles.date}>
                      Mission du : {new Date(item.dateMission).toLocaleDateString("fr-FR")}
                    </Text>
                  )}
                  {item.localisation && (
                    <Text style={styles.localisation}>Lieu : {item.localisation}</Text>
                  )}
                </View>
              )}
              contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", marginTop: 32 }}>
                  <Text style={{ color: "#888", textAlign: "center", marginBottom: 12 }}>
                    Aucun job terminé trouvé. Veuillez participer à des missions !
                  </Text>
                  <TouchableOpacity
                    style={styles.linkBtn}
                    onPress={() => {
                      setShowHistory(false);
                      router.push("/Travailleur/home-user");
                    }}
                  >
                    <Text style={styles.linkText}>Voir les missions disponibles</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#205C3B",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 4,
  },
  status: {
    fontSize: 15,
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
  },
  localisation: {
    fontSize: 14,
    color: "#2563eb",
    marginBottom: 2,
  },
  linkBtn: {
    backgroundColor: "#205C3B",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  linkText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    backgroundColor: "#205C3B",
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#205C3B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    zIndex: 10,
  },
  fabText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    width: "100%",
    maxHeight: "85%",
    padding: 8,
    elevation: 6,
  },
  closeBtn: {
    alignSelf: "flex-end",
    padding: 8,
    marginBottom: 4,
  },
});
