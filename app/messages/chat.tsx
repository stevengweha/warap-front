import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native"; // pour rafraîchir à chaque focus
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import io from "socket.io-client";
import BottomTabBar from "../components/BottomTabBar";

const SOCKET_URL = "http://192.168.1.115:5001"; // adapte si besoin

export default function ChatView() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [seenMessageId, setSeenMessageId] = useState<string | null>(null);
  const router = useRouter();
  const flatListRef = useRef(null);
  const { senderId, jobId: paramJobId, conversationId } = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const isFocused = useIsFocused();

  // Ajoute un état pour stocker le titre de l'offre
  const [jobTitle, setJobTitle] = useState<string>("");

  // Récupère l'utilisateur connecté
  useEffect(() => {
    const getUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        // Correction : vérifie la clé exacte de l'utilisateur connecté
        const userId = user._id || user.id || user.userId;
        if (userId) setCurrentUserId(userId.toString());
        else setCurrentUserId(null);
        console.log("user connecté (chat.tsx):", user);
      }
    };
    getUser();
  }, []);

  // Récupère la conversation initiale (attend currentUserId)
  useEffect(() => {
    if (!currentUserId) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          conversationId
            ? `${SOCKET_URL}/api/messages/job/${paramJobId}?conversationId=${conversationId}`
            : `${SOCKET_URL}/api/messages/job/${paramJobId}`
        );
        const data = await res.json();
        console.log("messages backend:", data);
        // Correction : compare bien les IDs en string
        const filtered = data.filter(
          (msg: any) =>
            ((msg.senderId?._id?.toString?.() || msg.senderId?._id || msg.senderId) === currentUserId &&
              (msg.receiverId?._id?.toString?.() || msg.receiverId?._id || msg.receiverId) === senderId) ||
            ((msg.senderId?._id?.toString?.() || msg.senderId?._id || msg.senderId) === senderId &&
              (msg.receiverId?._id?.toString?.() || msg.receiverId?._id || msg.receiverId) === currentUserId)
        );
        console.log("messages filtrés pour la conversation:", filtered);
        setMessages(filtered.sort((a: any, b: any) => new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime()));
      } catch (e) {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [paramJobId, senderId, conversationId, currentUserId]);

  // Connexion socket.io (attend currentUserId)
  useEffect(() => {
    if (!currentUserId) return;
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

    // Log tous les événements reçus pour debug
    socketRef.current.onAny((event, ...args) => {
      console.log("[socket.io] event:", event, ...args);
    });

    socketRef.current.on("connect", () => {
      console.log("Socket.io connecté :", socketRef.current.id);
      // Signale la présence de l'utilisateur
      socketRef.current.emit("userOnline", { userId: currentUserId });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket.io déconnecté");
    });

    // Ecoute la présence de l'autre utilisateur
    socketRef.current.on("userOnlineStatus", (data: { userId: string; online: boolean }) => {
      if (data.userId === senderId) {
        setIsRecipientOnline(data.online);
        console.log("Statut en ligne de l'interlocuteur :", data.online);
      }
    });

    // Ecoute l'événement "typing"
    socketRef.current.on("typing", (data: { from: string; to: string }) => {
      if (data.from === senderId && data.to === currentUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000); // reset après 2s
      }
    });

    // Ecoute l'événement "seen"
    socketRef.current.on("seen", (data: { messageId: string; userId: string }) => {
      if (data.userId === senderId) {
        setSeenMessageId(data.messageId);
        console.log("Message vu par l'interlocuteur :", data.messageId);
      }
    });

    if (conversationId) {
      socketRef.current.emit("joinConversation", conversationId);
    }

    // Signale la présence à l'autre utilisateur
    socketRef.current.emit("checkUserOnline", { userId: senderId });

    return () => {
      socketRef.current.disconnect();
    };
  }, [conversationId, currentUserId, senderId]);

  // Rafraîchit la conversation à chaque focus (pour recevoir en direct)
  useEffect(() => {
    if (isFocused && currentUserId) {
      const fetchMessages = async () => {
        setLoading(true);
        try {
          const res = await fetch(
            conversationId
              ? `${SOCKET_URL}/api/messages/job/${paramJobId}?conversationId=${conversationId}`
              : `${SOCKET_URL}/api/messages/job/${paramJobId}`
          );
          const data = await res.json();
          console.log("messages backend (refresh):", data);
          const filtered = data.filter(
            (msg: any) =>
              ((msg.senderId?._id?.toString?.() || msg.senderId?._id || msg.senderId) === currentUserId &&
                (msg.receiverId?._id?.toString?.() || msg.receiverId?._id || msg.receiverId) === senderId) ||
              ((msg.senderId?._id?.toString?.() || msg.senderId?._id || msg.senderId) === senderId &&
                (msg.receiverId?._id?.toString?.() || msg.receiverId?._id || msg.receiverId) === currentUserId)
          );
          setMessages(filtered.sort((a: any, b: any) => new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime()));
        } catch (e) {
          setMessages([]);
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [isFocused, paramJobId, senderId, conversationId, currentUserId]);

  // Envoi d'un message + signale "typing"
  const sendMessage = async () => {
    if (!input.trim() || !currentUserId || !paramJobId || !senderId || sending) {
      console.log("Guard failed", { input, currentUserId, paramJobId, senderId, sending });
      return;
    }
    setSending(true);
    const tempId = Date.now().toString();
    const optimisticMsg = {
      _id: tempId,
      contenu: input,
      dateEnvoi: new Date().toISOString(),
      senderId: { _id: currentUserId },
      receiverId: senderId,
      jobId: paramJobId,
      isMine: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInput("");
    try {
      // Envoi via socket.io pour temps réel
      if (conversationId && socketRef.current && socketRef.current.connected) {
        console.log("Socket emit sendMessage", {
          conversationId,
          message: {
            senderId: currentUserId,
            receiverId: senderId,
            contenu: optimisticMsg.contenu,
            jobId: paramJobId,
            dateEnvoi: optimisticMsg.dateEnvoi,
          },
        });
        socketRef.current.emit("sendMessage", {
          conversationId,
          message: {
            senderId: currentUserId,
            receiverId: senderId,
            contenu: optimisticMsg.contenu,
            jobId: paramJobId,
            dateEnvoi: optimisticMsg.dateEnvoi,
          },
        });
        socketRef.current.emit("typing", { from: currentUserId, to: senderId });
      } else {
        console.log("Socket non connecté ou pas de conversationId", {
          conversationId,
          socketConnected: !!socketRef.current?.connected,
        });
      }
      // Envoi via API pour persistance
      const response = await fetch("http://192.168.1.115:5001/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: senderId,
          contenu: optimisticMsg.contenu,
          jobId: paramJobId,
          conversationId: conversationId || undefined,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Erreur API:", errorText);
        setMessages(prev => prev.filter(m => m._id !== tempId));
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => m._id !== tempId));
      console.log("Erreur envoi message", e);
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Affichage du nom de l'expéditeur
  const recipient = messages.length > 0
    ? (messages[0].senderId._id === currentUserId ? messages[0].receiverId : messages[0].senderId)
    : null;

  // Récupère le titre de l'offre à partir de l'API si besoin
  useEffect(() => {
    const fetchJobTitle = async () => {
      if (!paramJobId) return;
      try {
        const res = await fetch(`http://192.168.1.115:5001/api/jobs/${paramJobId}`);
        if (res.ok) {
          const data = await res.json();
          setJobTitle(data.titre || "");
        }
      } catch (e) {
        setJobTitle("");
      }
    };
    fetchJobTitle();
  }, [paramJobId]);

  // Quand l'utilisateur tape, signale "typing"
  const handleInputChange = (text: string) => {
    setInput(text);
    if (socketRef.current && socketRef.current.connected && text.trim()) {
      socketRef.current.emit("typing", { from: currentUserId, to: senderId });
    }
  };

  // Quand l'utilisateur lit les messages, signale "seen"
  useEffect(() => {
    if (messages.length > 0 && currentUserId && senderId && socketRef.current && socketRef.current.connected) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.receiverId?._id === currentUserId && lastMsg.senderId?._id === senderId) {
        socketRef.current.emit("seen", { messageId: lastMsg._id, userId: currentUserId });
      }
    }
  }, [messages, currentUserId, senderId]);

  if (!paramJobId) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#c00", fontWeight: "bold", fontSize: 18, marginTop: 32 }}>
          Impossible d'ouvrir la discussion : aucune offre de job sélectionnée.
        </Text>
        <BottomTabBar />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Discussion pour l'offre {jobTitle || paramJobId} avec {recipient?.nom || "Expéditeur inconnu"} {recipient?.prenom || ""}
        {isRecipientOnline && <Text style={{ color: "#22c55e", fontSize: 14 }}> ● en ligne</Text>}
      </Text>
      <TouchableOpacity
        style={styles.jobLink}
        onPress={() =>
          router.push({
            pathname: "/components/offerdetails",
            params: {
              jobId: paramJobId,
              // On transmet aussi senderId et conversationId pour garder le contexte si besoin
              senderId: senderId,
              conversationId: conversationId || undefined,
            }
          })
        }
      >
        <Text style={styles.jobLinkText}>Voir la fiche de l'offre</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.senderId?._id === currentUserId ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.contenu}</Text>
              <Text style={styles.date}>
                {item.dateEnvoi ? new Date(item.dateEnvoi).toLocaleString("fr-FR") : ""}
                {item._id === seenMessageId && item.senderId?._id === currentUserId && (
                  <Text style={{ color: "#22c55e", fontSize: 11 }}> ● Vu</Text>
                )}
              </Text>
            </View>
          )}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
          ListEmptyComponent={
            <Text style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
              Aucun message pour cette conversation.
            </Text>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      {isTyping && (
        <Text style={{ color: "#2563eb", marginLeft: 8, marginBottom: 4 }}>L'utilisateur écrit...</Text>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            value={input}
            onChangeText={handleInputChange}
            editable={!sending}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={async () => {
              if (!input.trim() || !currentUserId || !paramJobId || !senderId || sending) {
                alert("Remplis tous les champs et attends la connexion.");
                return;
              }
              await sendMessage();
            }}
            disabled={sending || !input.trim()}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8F5", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#205C3B", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  sender: { fontWeight: "bold", color: "#205C3B", fontSize: 16 },
  preview: { color: "#333", marginTop: 4, marginBottom: 2 },
  date: { color: "#888", fontSize: 12 },
  unread: { color: "#fff", backgroundColor: "#205C3B", alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, fontSize: 12, marginTop: 4 },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: "#205C3B",
    alignSelf: "flex-end",
  },
  theirMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    color: "#222",
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    color: "#222",
  },
  sendButton: {
    backgroundColor: "#205C3B",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  jobLink: {
    alignSelf: "flex-start",
    backgroundColor: "#205C3B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  jobLinkText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  header: {
    padding: 16,
    backgroundColor: "#205C3B",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  bubble: {
    maxWidth: "80%",
    marginBottom: 10,
    padding: 10,
    borderRadius: 12,
  },
  bubbleLeft: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderColor: "#38bdf8",
    borderWidth: 1,
  },
  bubbleRight: {
    backgroundColor: "#38bdf8",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  bubbleText: {
    color: "#205C3B",
    fontSize: 15,
  },
  bubbleDate: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e0e7ef",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e7ef",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#f9fafb",
    color: "#205C3B",
  },
  sendButton: {
    backgroundColor: "#205C3B",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
