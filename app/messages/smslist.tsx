import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import io from "socket.io-client";
import BottomTabBar from "../components/BottomTabBar";

export default function SmsList() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketRef = useRef<any>(null);
  const router = useRouter();
  const isFocused = useIsFocused();

  useEffect(() => {
    socketRef.current = io("http://192.168.1.115:5001", { transports: ["websocket"] });
    socketRef.current.on("userOnlineStatus", (users: string[]) => {
      setOnlineUsers(users);
    });
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchUserAndMessages = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        let userId = null;
        if (userString) {
          const user = JSON.parse(userString);
          userId = user._id || user.id || user.userId;
          if (userId) userId = userId.toString();
          setCurrentUserId(userId);
          if (socketRef.current && userId) {
            socketRef.current.emit("userOnline", userId);
          }
        }
        const res = await fetch("http://192.168.1.115:5001/api/Allmessages");
        const data = await res.json();
        if (!userId) {
          setMessages([]);
          return;
        }
        // On prend tous les messages où l'utilisateur est soit l'expéditeur, soit le destinataire
        const allMsgs = data.filter(
          (msg: any) =>
            (msg.senderId?._id?.toString?.() || msg.senderId?._id || msg.senderId) === userId ||
            (msg.receiverId?._id?.toString?.() || msg.receiverId?._id || msg.receiverId) === userId
        );
        // Grouper par (jobId + autreUserId) et garder le dernier message échangé (envoyé OU reçu)
        const grouped = Object.values(
          allMsgs.reduce((acc: Record<string, any>, msg: any) => {
            const senderId = msg.senderId?._id?.toString?.() || msg.senderId;
            const receiverId = msg.receiverId?._id?.toString?.() || msg.receiverId;
            const jobId = msg.jobId?._id?.toString?.() || msg.jobId;
            if (!jobId) return acc;
            // L'autre utilisateur est celui qui n'est pas moi
            let otherUser, otherUserId;
            if (senderId === userId) {
              otherUser = msg.receiverId;
              otherUserId = receiverId;
            } else {
              otherUser = msg.senderId;
              otherUserId = senderId;
            }
            if (!otherUserId) return acc;
            const key = `${jobId}_${otherUserId}`;
            if (
              !acc[key] ||
              new Date(msg.dateEnvoi) > new Date(acc[key].dateEnvoi)
            ) {
              acc[key] = { ...msg, __otherUser: otherUser };
            }
            return acc;
          }, {})
        );
        setMessages(grouped.sort((a, b) => new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime()));
      } catch (e) {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndMessages();
    interval = setInterval(fetchUserAndMessages, 3000);

    return () => clearInterval(interval);
  }, [isFocused]);

  if (!currentUserId) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
        <BottomTabBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      {loading ? (
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={item => item._id}
          renderItem={({ item }) => {
            const userId = currentUserId;
            const otherUser = item.__otherUser;
            const job = item.jobId;
            const otherUserId = otherUser?._id?.toString?.() || otherUser?._id || otherUser;
            const isOnline = onlineUsers.includes(otherUserId);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={async () => {
                  // Marquer comme lu si le message ne l'est pas et que je suis le destinataire
                  if (!item.lu && item.receiverId?._id === userId) {
                    try {
                      await fetch(`http://192.168.1.115:5001/api/messages/${item._id}/read`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ lu: true }),
                      });
                    } catch (e) {
                      // ignore erreur
                    }
                  }
                  router.push({
                    pathname: "/messages/chat",
                    params: {
                      senderId: otherUserId,
                      jobId: job._id || job,
                      conversationId: item.conversationId?._id || item.conversationId || "",
                    },
                  });
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.sender}>
                    {otherUser?.nom || "Expéditeur inconnu"} {otherUser?.prenom || ""}
                  </Text>
                  {isOnline && <View style={styles.onlineDot} />}
                </View>
                <Text style={styles.jobTitle}>
                  {job?.titre ? `Offre : ${job.titre}` : ""}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.contenu}
                </Text>
                <Text style={styles.date}>
                  {item.dateEnvoi ? new Date(item.dateEnvoi).toLocaleString("fr-FR") : ""}
                </Text>
                {!item.lu && item.receiverId?._id === userId && (
                  <Text style={styles.unread}>Non lu</Text>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
              Aucun message.
            </Text>
          }
        />
      )}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8F5", padding: 16 , paddingBottom: 80 }, // espace pour la bottom bar
  title: { fontSize: 22, fontWeight: "bold", color: "#205C3B", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  sender: { fontWeight: "bold", color: "#205C3B", fontSize: 16 },
  jobTitle: {
    fontWeight: "bold",
    color: "#38bdf8",
    fontSize: 14,
    marginBottom: 2,
  },
  preview: { color: "#333", marginTop: 4, marginBottom: 2 },
  date: { color: "#888", fontSize: 12 },
  unread: { color: "#fff", backgroundColor: "#205C3B", alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, fontSize: 12, marginTop: 4 },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    marginLeft: 8,
  },
});
