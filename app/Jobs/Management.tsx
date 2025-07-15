import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomTabBar from "../components/BottomTabBar";

type Job = {
  _id: string;
  userId: string;
  jobId: string;
  titre: string;
  description?: string;
  categorie?: string;
  localisation?: string;
  datePostee?: string;
  statut?: "ouverte" | "en_cours" | "complétée" | "annulée";
  remuneration?: number;
  dateMission?: string;
  candidatureCount?: number;
};

const Management = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [candidatureCounts, setCandidatureCounts] = useState<Record<string, number>>({});
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

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://warap-back.onrender.com/api/Alljobs");
      if (!res.ok) throw new Error("Erreur lors du chargement des offres");
      const data = await res.json();
      // Filtre ici selon l'utilisateur connecté
      const filtered = currentUserId
        ? data.filter((job: any) =>
            (job.userId?._id || job.userId) === currentUserId
          )
        : [];

        //filtre du plus récent
         const sorted = filtered.sort((a: Job, b: Job) =>
        new Date(b.datePostee ?? 0).getTime() - new Date(a.datePostee ?? 0).getTime()
      );
      setJobs(filtered);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidatureCounts = async (jobIds: string[]) => {
    try {
      const res = await fetch("https://warap-back.onrender.com/api/candidatures");
      const data = await res.json();
      const counts: Record<string, number> = {};
      jobIds.forEach((jobId) => {
        counts[jobId] = data.filter((c: any) => c.jobId?._id === jobId).length;
      });
      setCandidatureCounts(counts);
    } catch {
      setCandidatureCounts({});
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (currentUserId && jobs.length > 0) {
        fetchCandidatureCounts(jobs.map(j => j._id));
      }
    }, [currentUserId, jobs])
  );

  useEffect(() => {
    if (currentUserId) {
      fetchJobs();
    }
  }, [currentUserId]);

 const handleDelete = async (id: string) => {
  console.log("Suppression demandée pour id:", id);

  const confirmDelete = () => {
    if (Platform.OS === "web") {
      return window.confirm("Supprimer cette offre ?");
    } else {
      return new Promise((resolve) => {
        Alert.alert(
          "Confirmation",
          "Supprimer cette offre ?",
          [
            { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
            { text: "Supprimer", style: "destructive", onPress: () => resolve(true) },
          ],
          { cancelable: false }
        );
      });
    }
  };

  const confirmed = await confirmDelete();
  if (!confirmed) return;

  try {
    const res = await fetch(`https://warap-back.onrender.com/api/jobs/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Erreur lors de la suppression");
    }
    setJobs(jobs.filter((job) => job._id !== id));
    Alert.alert("Succès", "Offre supprimée avec succès");
  } catch (err: any) {
    console.error("Erreur suppression:", err);
    Alert.alert("Erreur", err.message);
  }
};


  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Gestion des offres d'emploi</Text>
        </View>
        <View style={[styles.addButtonContainer, { flexDirection: "row", gap: 12 }]}>
          <Link href="/Jobs/CJ" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Nouvelle offre</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#205C3B" }]}
            onPress={() => router.push("/Jobs/ManagePastCurrentJobs")}
          >
            <Text style={styles.addButtonText}>Voir jobs en cours/passés</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : jobs.length === 0 ? (
          <Text>Aucune offre trouvée.</Text>
        ) : (
          jobs.map((job) => (
            <View key={job._id} style={styles.jobCard}>
              <Text style={styles.jobTitle}>{job.titre}</Text>
              <Text style={styles.jobCategorie}>{job.categorie}</Text>
              <Text>{job.localisation}</Text>
              <Text>{job.remuneration ? `${job.remuneration} €` : ""}</Text>
              <Text style={styles.jobStatus}>
                Statut : {job.statut}
                {job.dateMission && ` | Mission : ${new Date(job.dateMission).toLocaleDateString()}`}
              </Text>
              <Text style={styles.candidatureCount}>
                Candidatures reçues : {candidatureCounts[job._id] ?? 0}
              </Text>
              <View style={styles.buttonRow}>
                <View style={{ flexDirection: "row", flex: 1 }}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push(`/Jobs/Edit/${job._id}`)}
                  >
                    <Text style={styles.buttonText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(job._id)}
                  >
                    <Text style={styles.buttonText}>Supprimer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.candidatureButton}
                    onPress={() => router.push({ pathname: "/Jobs/ManageCandidatures", params: { jobId: job._id } })}
                  >
                    <Text style={styles.buttonText}>Voir candidatures</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <BottomTabBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#F7F8F5", // même fond que home-user
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#205C3B", // vert foncé home-user
  },
  addButtonContainer: {
    alignItems: "flex-start",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#38bdf8", // bleu clair accent (cohérent avec home-user)
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#0ea5e9",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  jobCard: {
    borderWidth: 1,
    borderColor: "#e0e7ef", // gris doux
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  jobTitle: {
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 2,
    color: "#205C3B", // vert foncé
  },
  jobCategorie: {
    color: "#38bdf8", // bleu clair accent
    fontSize: 14,
    marginBottom: 2,
  },
  jobStatus: {
    color: "#64748b", // gris/bleu doux
    fontSize: 12,
    marginTop: 4,
  },
  candidatureCount: {
    color: "#2563eb",
    fontWeight: "bold",
    marginTop: 4,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#205C3B", // vert foncé home-user
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "#ef4444", // rouge accent
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  candidatureButton: {
    backgroundColor: "#38bdf8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  error: {
    color: "#ef4444",
    marginBottom: 16,
  },

  scrollContainer: {
  flexGrow: 1,
  backgroundColor: "#F7F8F5",
    paddingBottom:75, // espace pour BottomTabBar

},
});

export default Management;
