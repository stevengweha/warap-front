import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomTabBar from "../components/BottomTabBar";
import JobHistory from "../components/JobHistory";

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

export default function ManageJob() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"all" | "en_attente" | "acceptee" | "refusee">("all");
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
    const fetchCandidatures = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://warap-back.onrender.com/api/candidatures");
        const data = await res.json();
        // Filtrer pour n'afficher que les candidatures liées à mes offres OU mes propres candidatures
        const filtered = data.filter(
          (c: Candidature) =>
            // Si je suis le recruteur de l'offre (historique des jobs réalisés ou candidatures reçues)
            c.jobId && c.jobId._id && c.chercheurId && currentUserId &&
            (c.chercheurId._id === currentUserId || c.jobId.userId === currentUserId)
        );
        setCandidatures(filtered);
      } catch (e) {
        setCandidatures([]);
      } finally {
        setLoading(false);
      }
    };
    if (currentUserId) fetchCandidatures();
  }, [currentUserId]);

  const filteredCandidatures = candidatures
  .filter(c => selectedTab === "all" ? true : c.statut === selectedTab)
  .sort((a, b) => new Date(b.dateCandidature).getTime() - new Date(a.dateCandidature).getTime());


  const renderTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === "all" && styles.tabActive]}
        onPress={() => setSelectedTab("all")}
      >
        <Text style={[styles.tabText, selectedTab === "all" && styles.tabTextActive]}>Toutes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === "en_attente" && styles.tabActive]}
        onPress={() => setSelectedTab("en_attente")}
      >
        <Text style={[styles.tabText, selectedTab === "en_attente" && styles.tabTextActive]}>En attente</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === "acceptee" && styles.tabActive]}
        onPress={() => setSelectedTab("acceptee")}
      >
        <Text style={[styles.tabText, selectedTab === "acceptee" && styles.tabTextActive]}>Acceptées</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === "refusee" && styles.tabActive]}
        onPress={() => setSelectedTab("refusee")}
      >
        <Text style={[styles.tabText, selectedTab === "refusee" && styles.tabTextActive]}>Refusées</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: Candidature }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: "/Jobs/CandidatureDetail", params: { candidatureId: item._id } })}
      activeOpacity={0.85}
    >
      <Text style={styles.jobTitle}>{item.jobId?.titre || "Offre inconnue"}</Text>
      <Text style={styles.status}>
        Statut : <Text style={{
          color:
            item.statut === "acceptee"
              ? "#22c55e"
              : item.statut === "refusee"
              ? "#ef4444"
              : "#f59e42"
        }}>{item.statut}</Text>
      </Text>
      <Text style={styles.date}>
        Candidature du : {item.dateCandidature ? new Date(item.dateCandidature).toLocaleDateString("fr-FR") : ""}
      </Text>
      <Text style={styles.candidat}>
        Candidat : {item.chercheurId?.prenom} {item.chercheurId?.nom} ({item.chercheurId?.email})
      </Text>
      {item.message && (
        <Text style={styles.message}>Message : {item.message}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8F5" }}>
      <Text style={styles.title}>Mes candidatures & Historique</Text>
      {renderTabs()}
      {showHistory ? (
        // Affiche JobHistory dans la page principale à la place de la liste
        <>
          <TouchableOpacity
            style={[styles.fab, { bottom: 150, backgroundColor: "#fff", borderWidth: 1, borderColor: "#205C3B" }]}
            onPress={() => setShowHistory(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.fabText, { color: "#205C3B" }]}>←</Text>
          </TouchableOpacity>
          <JobHistory />
        </>
      ) : loading ? (
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filteredCandidatures}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
              Aucun historique ou candidature trouvée.
            </Text>
          }
        />
      )}
      {/* Affiche le bouton flottant UNIQUEMENT si JobHistory n'est pas affiché */}
      {!showHistory && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowHistory(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>🕓</Text>
        </TouchableOpacity>
      )}
      <BottomTabBar />
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
  candidat: {
    fontSize: 14,
    color: "#2563eb",
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    marginTop: 4,
    paddingHorizontal: 8,
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
  fab: {
    position: "absolute",
    right: 24,
    bottom: 90,
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
});
