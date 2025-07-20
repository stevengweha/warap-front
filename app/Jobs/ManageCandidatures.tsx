import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomTabBar from "../components/BottomTabBar";

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

export default function ManageCandidatures() {
  const params = useLocalSearchParams();
  const jobId = params.jobId as string;
  const router = useRouter();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidatures = async () => {
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

  useEffect(() => {
    if (jobId) fetchCandidatures();
  }, [jobId]);

  const handleUpdateStatut = async (id: string, statut: "acceptee" | "refusee") => {
  try {
    const res = await fetch(`https://warap-back.onrender.com/api/candidatures/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    if (!res.ok) throw new Error("Erreur lors de la mise à jour");

    // Suppression de la mise à jour manuelle du job ici (plus besoin)

    await fetchCandidatures();
  } catch (e: any) {
    Alert.alert("Erreur", e.message);
  }
};

const handleCancelAcceptance = async (id: string) => {
  try {
    const res = await fetch(`https://warap-back.onrender.com/api/candidatures/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "en_attente" }),
    });
    if (!res.ok) throw new Error("Erreur lors de l'annulation");

    // Suppression de la mise à jour manuelle du job ici (plus besoin)

    await fetchCandidatures();
  } catch (e: any) {
    Alert.alert("Erreur", e.message);
  }
};


  const goToChat = (candidature: Candidature) => {
    router.push({
      pathname: "/messages/chat",
      params: {
        senderId: candidature.chercheurId._id,
        jobId: candidature.jobId._id,
      },
    });
  };

  const renderItem = ({ item }: { item: Candidature }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.93}
      onPress={() =>
        router.push({
          pathname: "/components/JobControlCenter",
          params: {
            jobId: item.jobId._id,
            candidatId: item.chercheurId._id,
          },
        })
      }
    >
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/profiles/detailuser",
                params: { userId: item.chercheurId._id },
              })
            }
          >
            {item.chercheurId?.photoProfil ? (
              <Image source={{ uri: item.chercheurId.photoProfil }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "#e5e7eb" }]} />
            )}
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.name}>
              {item.chercheurId?.prenom} {item.chercheurId?.nom}
            </Text>
            <Text style={styles.email}>{item.chercheurId?.email}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.chatBtn} onPress={() => goToChat(item)}>
          <Text style={styles.chatBtnText}>Chat</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.jobTitle}>{item.jobId?.titre}</Text>
      <Text style={styles.status}>
        Statut :{" "}
        <Text
          style={{
            color:
              item.statut === "acceptee"
                ? "#22c55e"
                : item.statut === "refusee"
                ? "#ef4444"
                : "#f59e42",
          }}
        >
          {item.statut}
        </Text>
      </Text>
      <Text style={styles.date}>
        Candidature du :{" "}
        {item.dateCandidature ? new Date(item.dateCandidature).toLocaleDateString("fr-FR") : ""}
      </Text>
      {item.message && <Text style={styles.message}>Message : {item.message}</Text>}

      <View style={styles.buttonRow}>
        {item.statut === "en_attente" && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#22c55e" }]}
              onPress={() => handleUpdateStatut(item._id, "acceptee")}
            >
              <Text style={styles.actionText}>Accepter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
              onPress={() => handleUpdateStatut(item._id, "refusee")}
            >
              <Text style={styles.actionText}>Refuser</Text>
            </TouchableOpacity>
          </>
        )}

        {item.statut === "acceptee" && (
          <View style={{ flexDirection: "row", flex: 1, justifyContent: "center", gap: 8 }}>
            <Text style={styles.acceptedText}>Candidature acceptée</Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#f59e42", flex: 0.5 }]}
              onPress={() => handleCancelAcceptance(item._id)}
            >
              <Text style={styles.actionText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.statut === "refusee" && (
          <Text style={styles.refusedText}>Candidature refusée</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8F5" }}>
      <Text style={styles.title}>Candidatures reçues</Text>
      {loading ? (
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={candidatures}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
              Aucune candidature reçue pour cette offre.
            </Text>
          }
        />
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
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eee",
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#205C3B",
  },
  email: {
    color: "#2563eb",
    fontSize: 14,
  },
  jobTitle: {
    fontSize: 15,
    color: "#205C3B",
    fontWeight: "600",
    marginBottom: 2,
  },
  status: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
    alignItems: "center",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  acceptedText: {
    color: "#22c55e",
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    alignSelf: "center",
  },
  refusedText: {
    color: "#ef4444",
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  chatBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  chatBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
