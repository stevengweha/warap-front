import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Job = {
  _id: string;
  titre: string;
  statut: string;
  dateMission?: string;
  localisation?: string;
  categorie?: string;
  remuneration?: number;
};

type Candidature = {
  _id: string;
  jobId: Job;
  statut: string;
  chercheurId: { prenom: string; nom: string; _id: string };
  message?: string;
};

export default function ManagePastCurrentJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedStatut, setSelectedStatut] = useState<"en_cours" | "termine" | "all">("en_cours");
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
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
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://warap-back.onrender.com/api/Alljobs");
        const data = await res.json();
        const filtered = currentUserId
          ? data.filter((job: any) =>
              (job.userId?._id || job.userId) === currentUserId &&
              (selectedStatut === "all" ? true : job.statut === selectedStatut)
            )
          : [];
        setJobs(filtered);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    if (currentUserId) fetchJobs();
  }, [currentUserId, selectedStatut]);

  // Récupère les candidatures du job sélectionné
  const fetchCandidatures = async (jobId: string) => {
    setLoading(true);
    try {
      const res = await fetch("https://warap-back.onrender.com/api/candidatures");
      const data = await res.json();
      setCandidatures(data.filter((c: Candidature) => c.jobId?._id === jobId));
    } catch {
      setCandidatures([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8F5" }}>
      <Text style={styles.title}>Jobs en cours / passés</Text>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedStatut === "en_cours" && styles.tabActive]}
          onPress={() => setSelectedStatut("en_cours")}
        >
          <Text style={[styles.tabText, selectedStatut === "en_cours" && styles.tabTextActive]}>En cours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedStatut === "termine" && styles.tabActive]}
          onPress={() => setSelectedStatut("termine")}
        >
          <Text style={[styles.tabText, selectedStatut === "termine" && styles.tabTextActive]}>Terminés</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedStatut === "all" && styles.tabActive]}
          onPress={() => setSelectedStatut("all")}
        >
          <Text style={[styles.tabText, selectedStatut === "all" && styles.tabTextActive]}>Tous</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                setSelectedJob(item);
                fetchCandidatures(item._id);
              }}
            >
              <Text style={styles.jobTitle}>{item.titre}</Text>
              <Text style={styles.status}>Statut : <Text style={{ color: "#2563eb" }}>{item.statut}</Text></Text>
              {item.dateMission && (
                <Text style={styles.date}>
                  Mission du : {new Date(item.dateMission).toLocaleDateString("fr-FR")}
                </Text>
              )}
              {item.localisation && (
                <Text style={styles.localisation}>Lieu : {item.localisation}</Text>
              )}
              {item.categorie && (
                <Text style={styles.categorie}>Catégorie : {item.categorie}</Text>
              )}
              {item.remuneration && (
                <Text style={styles.remuneration}>Rémunération : {item.remuneration} €</Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
              Aucun job trouvé pour ce filtre.
            </Text>
          }
        />
      )}
      {/* Affiche les candidatures du job sélectionné */}
      {selectedJob && (
        <View style={styles.candidaturesPanel}>
          <Text style={styles.panelTitle}>Candidatures pour : {selectedJob.titre}</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              setSelectedJob(null);
              setCandidatures([]);
            }}
          >
            <Text style={{ fontSize: 18, color: "#205C3B" }}>✕</Text>
          </TouchableOpacity>
          <FlatList
            data={candidatures}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <View style={styles.candCard}>
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
      )}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backBtnText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#205C3B",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 8,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 2,
  },
  tabActive: {
    backgroundColor: "#205C3B",
  },
  tabText: {
    color: "#205C3B",
    fontWeight: "bold",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#fff",
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
  categorie: {
    fontSize: 14,
    color: "#2563eb",
    marginBottom: 2,
  },
  remuneration: {
    fontSize: 14,
    color: "#205C3B",
    marginBottom: 2,
  },
  candidaturesPanel: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    elevation: 8,
    padding: 16,
    zIndex: 20,
  },
  panelTitle: {
    fontWeight: "bold",
    fontSize: 17,
    color: "#205C3B",
    marginBottom: 8,
    textAlign: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 8,
    zIndex: 30,
  },
  candCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
  candMsg: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },
  backBtn: {
  alignSelf: "center",
  backgroundColor: "#205C3B",
  borderRadius: 8,
  paddingHorizontal: 24,
  paddingVertical: 10,
  marginTop: 16,
  marginBottom: 24, // bon espacement au-dessus de la bottom bar
},
  backBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
