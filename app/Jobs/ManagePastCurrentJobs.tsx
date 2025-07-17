import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  chercheurId: {
    nom: string;
    prenom: string;
    email: string;
    photoProfil?: string;
    _id: string;
  };
  jobId: {
    titre: string;
    _id: string;
  };
  dateCandidature: string;
  statut: "en_attente" | "acceptee" | "refusee";
  message?: string;
};

export default function ManagePastCurrentJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedStatut, setSelectedStatut] = useState<
    "en_cours" | "termine" | "all"
  >("en_cours");

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

  const fetchCandidatures = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://warap-back.onrender.com/api/candidatures");
      const data = await res.json();
      setCandidatures(data);
    } catch {
      setCandidatures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) fetchCandidatures();
  }, [currentUserId]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://warap-back.onrender.com/api/Alljobs");
        const data = await res.json();
        const filtered = currentUserId
          ? data.filter(
              (job: any) =>
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

  const getCandidatInfoForJob = (jobId: string) => {
    const candidature = candidatures.find((c) => c.jobId._id === jobId);
    return candidature ? candidature.chercheurId : null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jobs en cours / passés</Text>

      {/* Onglets */}
      <View style={styles.tabs}>
        {["en_cours", "termine", "all"].map((statut) => (
          <TouchableOpacity
            key={statut}
            style={[styles.tab, selectedStatut === statut && styles.tabActive]}
            onPress={() => setSelectedStatut(statut as any)}
          >
            <Text
              style={[
                styles.tabText,
                selectedStatut === statut && styles.tabTextActive,
              ]}
            >
              {statut === "en_cours"
                ? "En cours"
                : statut === "termine"
                ? "Terminés"
                : "Tous"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des jobs */}
      {loading ? (
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const candidat = getCandidatInfoForJob(item._id);

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/components/JobControlCenter",
                    params: {
                      jobId: item._id,
                      candidatId: candidat?._id || "",
                    },
                  })
                }
              >
                <Text style={styles.jobTitle}>{item.titre}</Text>
                <Text style={styles.status}>
                  Statut :{" "}
                  <Text style={{ color: "#2563eb" }}>{item.statut}</Text>
                </Text>
                {item.dateMission && (
                  <Text style={styles.date}>
                    Mission du :{" "}
                    {new Date(item.dateMission).toLocaleDateString("fr-FR")}
                  </Text>
                )}
                {item.localisation && (
                  <Text style={styles.localisation}>
                    Lieu : {item.localisation}
                  </Text>
                )}
                {item.categorie && (
                  <Text style={styles.categorie}>
                    Catégorie : {item.categorie}
                  </Text>
                )}
                {item.remuneration && (
                  <Text style={styles.remuneration}>
                    Rémunération : {item.remuneration} €
                  </Text>
                )}
                {candidat && (
                  <Text style={styles.candidat}>
                    Candidat : {candidat.prenom} {candidat.nom}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun job trouvé pour ce filtre.</Text>
          }
        />
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
    paddingTop: Platform.OS === "web" ? 60 : 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#205C3B",
    marginTop: 8,
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
  candidat: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 32,
  },
  backBtn: {
    alignSelf: "center",
    backgroundColor: "#205C3B",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
