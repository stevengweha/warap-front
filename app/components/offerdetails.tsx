import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OfferDetails() {
  const params = useLocalSearchParams();
  const jobId = params.jobId ? String(params.jobId) : params.id ? String(params.id) : undefined;
  const senderIdFromParams = params.senderId ? String(params.senderId) : undefined;
  const conversationIdFromParams = params.conversationId ? String(params.conversationId) : undefined;
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(conversationIdFromParams);
  const [poster, setPoster] = useState<any>(null);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://warap-back.onrender.com/api/jobs/${jobId}`);
        const data = await res.json();
        setJob(data);
      } catch (e) {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchJob();
  }, [jobId]);

  useEffect(() => {
    const getUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) setCurrentUser(JSON.parse(userString));
    };
    getUser();
  }, []);

  // senderId = recruteur (celui qui a posté l'offre)
  const senderId = senderIdFromParams || (job?.userId?._id ? String(job.userId._id) : undefined);

  // Récupère la conversationId cohérente (toujours la même pour ce job et ces deux users)
  useEffect(() => {
    const fetchOrCreateConversation = async () => {
      if (!senderId || !currentUser?._id || !job?._id) return;
      try {
        const res = await fetch(`https://warap-back.onrender.com/api/conversations`);
        const data = await res.json();
        let conv = data.find(
          (c: any) =>
            c.jobId?._id === job._id &&
            c.participants.some((p: any) => String(p._id) === String(senderId)) &&
            c.participants.some((p: any) => String(p._id) === String(currentUser._id))
        );
        if (!conv) {
          const createRes = await fetch(`https://warap-back.onrender.com/api/conversations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participants: [String(senderId), String(currentUser._id)],
              jobId: String(job._id),
            }),
          });
          conv = await createRes.json();
        }
        setConversationId(conv._id);
      } catch (e) {
        setConversationId(undefined);
      }
    };
    if (senderId && currentUser && currentUser._id && job?._id && !conversationIdFromParams) fetchOrCreateConversation();
  }, [senderId, currentUser, job, conversationIdFromParams]);

  useEffect(() => {
    // Log pour voir ce qui entre dans le composant
    console.log("OfferDetails params:", params);
    console.log("jobId:", jobId, "senderIdFromParams:", senderIdFromParams, "conversationIdFromParams:", conversationIdFromParams);
  }, [params, jobId, senderIdFromParams, conversationIdFromParams]);

  useEffect(() => {
    if (job) {
      console.log("Job details:", job);
    }
    if (poster) {
      console.log("Poster details:", poster);
    }
  }, [job, poster]);

  useEffect(() => {
    if (job && job.userId && typeof job.userId === "string") {
      // Récupérer les infos du posteur si userId est un id
      fetch(`https://warap-back.onrender.com/api/users/${job.userId}`)
        .then(res => res.json())
        .then(data => setPoster(data))
        .catch(() => setPoster(null));
    } else if (job && job.userId && typeof job.userId === "object") {
      setPoster(job.userId);
    }
  }, [job]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#205C3B" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#888" }}>Offre introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullscreen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>{job.titre}</Text>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.text}>{job.description || "Aucune description"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Catégorie</Text>
            <Text style={styles.text}>{job.categorie || "Non précisée"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Localisation</Text>
            <Text style={styles.text}>{job.localisation || "Non précisée"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de mission</Text>
            <Text style={styles.text}>
              {job.dateMission ? new Date(job.dateMission).toLocaleDateString("fr-FR") : "Non définie"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rémunération</Text>
            <Text style={styles.text}>
              {job.remuneration ? `${job.remuneration} €` : "Non précisée"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Statut</Text>
            <Text
              style={[
                styles.status,
                job.statut === "Ouvert" ? styles.statusOpen : styles.statusClosed,
              ]}
            >
              {job.statut || "Statut inconnu"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Posté par</Text>
            <View>
              <Text style={styles.text}>
                {(poster?.nom || "Nom inconnu") + " " + (poster?.prenom || "")}
              </Text>
              <Text style={[styles.text, { color: "#38bdf8" }]}>{poster?.email || ""}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de publication</Text>
            <Text style={styles.text}>
              {job.datePostee ? new Date(job.datePostee).toLocaleDateString("fr-FR") : ""}
            </Text>
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => {
          // Correction : récupère l'id utilisateur de façon robuste (id ou _id)
          const userId =
            currentUser && (currentUser._id || currentUser.id)
              ? String(currentUser._id || currentUser.id)
              : undefined;
          console.log("DEBUG params to chat.tsx", {
            currentUser,
            currentUserId: userId,
            jobId,
            senderId,
            conversationId,
          });
          if (
            !userId ||
            !jobId ||
            !senderId
          ) {
            alert("Impossible d'accéder à la discussion : informations manquantes.");
            return;
          }
          router.push({
            pathname: "/messages/chat",
            params: {
              currentUserId: userId,
              jobId: String(jobId),
              senderId: String(senderId),
              conversationId: conversationId ? String(conversationId) : undefined,
            }
          });
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.chatButtonText}>Revenir a la discussion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: "#F7F8F5",
    justifyContent: "space-between",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 120,
    backgroundColor: "#F7F8F5",
    alignItems: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#205C3B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
    borderRadius: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 2,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontWeight: "bold",
    color: "#205C3B",
    fontSize: 15,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  text: {
    fontSize: 16,
    color: "#222",
    marginTop: 0,
    marginBottom: 2,
  },
  status: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 0,
  },
  statusOpen: {
    backgroundColor: "#d1fae5",
    color: "#166534",
  },
  statusClosed: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  chatButton: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 36,
    backgroundColor: "#205C3B",
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#205C3B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  chatButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 19,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8F5",
  },
});
