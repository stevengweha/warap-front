import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import io from "socket.io-client";
import BottomTabBar from "../components/BottomTabBar";

const SOCKET_URL = "https://warap-back.onrender.com";

interface Message {
  _id: string;
  contenu: string;
  dateEnvoi: string;
  senderId: { _id: string };
  receiverId: { _id: string };
  jobId: string;
  isMine?: boolean;
}

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [isRecipientOnline, setIsRecipientOnline] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [seenMessageId, setSeenMessageId] = useState<string | null>(null);
  const router = useRouter();
  const flatListRef = useRef<FlatList<Message>>(null);
  const { senderId, jobId: paramJobId, conversationId } = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const socketRef = useRef<SocketIOClient.Socket | null>(null);
  const isFocused = useIsFocused();
  const [jobTitle, setJobTitle] = useState<string>("");

  // Récupération de l'utilisateur
  useEffect(() => {
    const getUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        const userId = user._id || user.id || user.userId;
        if (userId) {
          setCurrentUserId(userId.toString());
          console.log("Utilisateur récupéré:", userId);
        }
      }
    };
    getUser();
  }, []);

  // Gestion de la connexion WebSocket
  useEffect(() => {
    if (!currentUserId) return;

    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      socketRef.current?.emit("userOnline", { userId: currentUserId });
      console.log("Connecté au serveur WebSocket.");
    });

    socketRef.current.on("userOnlineStatus", (data) => {
      console.log("Statut de l'utilisateur en ligne:", data);
      setIsRecipientOnline(data.includes(senderId));
    });

    socketRef.current.on("typing", (data) => {
      if (data.userId === senderId) {
        setIsTyping(true);
        console.log("L'utilisateur est en train de taper...");
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    socketRef.current.on("seen", (data) => {
      if (data.userId === senderId) {
        setSeenMessageId(data.messageId);
        console.log("Message vu:", data.messageId);
      }
    });

    socketRef.current.on("receiveMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      flatListRef.current?.scrollToEnd({ animated: true });
      console.log("Nouveau message reçu:", newMessage);
    });

    if (conversationId) {
      socketRef.current.emit("joinConversation", conversationId);
      console.log("Rejoint la conversation:", conversationId);
    }

    return () => {
      socketRef.current?.disconnect();
      console.log("Déconnexion du serveur WebSocket.");
    };
  }, [conversationId, currentUserId, senderId]);

  // Récupération des messages
  useEffect(() => {
    if (!currentUserId) return;

    const fetchMessages = async () => {
      const url = conversationId
        ? `${SOCKET_URL}/api/messages/job/${paramJobId}?conversationId=${conversationId}`
        : `${SOCKET_URL}/api/messages/job/${paramJobId}`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        const filtered = data.filter((msg: Message) => {
          const sender = msg.senderId?._id || msg.senderId;
          const receiver = msg.receiverId?._id || msg.receiverId;
          return (
            (sender === currentUserId && receiver === senderId) ||
            (sender === senderId && receiver === currentUserId)
          );
        });

        setMessages(filtered.sort((a, b) => new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime()));
        console.log("Messages récupérés:", filtered);
      } catch (e) {
        console.error("Erreur lors de la récupération des messages:", e);
        setMessages([]);
      }
    };

    fetchMessages();
  }, [paramJobId, senderId, conversationId, currentUserId]);

  // Envoi d'un message
  const sendMessageData = async () => {
  if (!input.trim()) return;

  const tempMessage: Message = {
    _id: Date.now().toString(), // id temporaire
    contenu: input,
    dateEnvoi: new Date().toISOString(),
    senderId: { _id: currentUserId! },
    receiverId: { _id: senderId as string },
    jobId: paramJobId as string,
    isMine: true,
  };

  // Ajout immédiat du message dans la liste (optimistic update)
  setMessages((prev) => [...prev, tempMessage]);
  flatListRef.current?.scrollToEnd({ animated: true });

  const messageData = {
    senderId: currentUserId,
    receiverId: senderId,
    contenu: input,
    jobId: paramJobId,
    conversationId: conversationId || undefined,
  };

  // Vider la zone de saisie immédiatement
  setInput("");
  setSending(true);

  try {
    const response = await fetch(`${SOCKET_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      console.error("Erreur lors de l'envoi du message:", response.status);
      // TODO: Optionnel : enlever le message temporaire ou marquer comme non envoyé
    } else {
      console.log("Message envoyé avec succès:", messageData);
      // La version finale du message sera ajoutée par le socket via "receiveMessage"
    }
  } catch (error) {
    console.error("Erreur de connexion au serveur:", error);
  } finally {
    setSending(false);
  }
};


  // Gestion de la saisie de texte
  const handleInputChange = (text: string) => {
    setInput(text);
    if (socketRef.current?.connected && text.trim()) {
      socketRef.current.emit("typing", { conversationId, userId: currentUserId });
      console.log("Saisie en cours:", text);
    }
  };

  // Mise à jour du statut de message vu
  useEffect(() => {
    if (messages.length && currentUserId && senderId && socketRef.current?.connected) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.receiverId._id === currentUserId && lastMsg.senderId._id === senderId) {
        socketRef.current.emit("seen", { conversationId, messageId: lastMsg._id, userId: currentUserId });
        console.log("Message marqué comme vu:", lastMsg._id);
      }
    }
  }, [messages]);

  // Récupération du titre du job
  const fetchJobTitle = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/jobs/${paramJobId}`);
      if (res.ok) {
        const data = await res.json();
        setJobTitle(data.titre || "");
        console.log("Titre du job récupéré:", data.titre);
      }
    } catch (e) {
      console.error("Erreur lors de la récupération du titre du job:", e);
      setJobTitle("");
    }
  };

  useEffect(() => {
    fetchJobTitle();
  }, [paramJobId]);

  const recipient = messages.length > 0
    ? messages[0].senderId._id === currentUserId
      ? messages[0].receiverId
      : messages[0].senderId
    : null;

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>
          Discussion pour l'offre {jobTitle || paramJobId} avec {recipient?.nom || "Expéditeur inconnu"} {recipient?.prenom || ""}
          {isRecipientOnline && <Text style={{ color: "#22c55e", fontSize: 14 }}> ● en ligne</Text>}
        </Text>

        <TouchableOpacity
          style={styles.jobLink}
          onPress={() => {
            router.push({
              pathname: "/components/offerdetails",
              params: { jobId: paramJobId, senderId, conversationId },
            });
          }}
        >
          <Text style={styles.jobLinkText}>Voir la fiche de l'offre</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.senderId?._id === currentUserId ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text style={[styles.messageText, item.senderId?._id === currentUserId && { color: "#fff" }]}>
                {item.contenu}
              </Text>
              <Text style={styles.date}>
                {new Date(item.dateEnvoi).toLocaleString("fr-FR")}
                {item._id === seenMessageId && item.senderId?._id === currentUserId && (
                  <Text style={{ color: "#22c55e", fontSize: 11 }}> ● Vu</Text>
                )}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardDismissMode="interactive"
          ListEmptyComponent={<Text style={{ color: "#888", textAlign: "center", marginTop: 32 }}>Aucun message pour cette conversation.</Text>}
        />

        {isTyping && <Text style={{ color: "#2563eb", marginLeft: 8, marginBottom: 4 }}>L'utilisateur écrit...</Text>}

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            value={input}
            onChangeText={handleInputChange}
            onSubmitEditing={sendMessageData} // Envoie les données directement
            returnKeyType="send"
            editable={!sending}
            multiline
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessageData} disabled={sending || !input.trim()}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
    padding: 16,
    paddingBottom: 80,
  },
  flexContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 12,
  },
  jobLink: {
    alignSelf: "flex-start",
    backgroundColor: "#205C3B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  jobLinkText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
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
  date: {
    marginTop: 4,
    fontSize: 11,
    color: "#888",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxHeight: 120,
    minHeight: 40,
    color: "#222",
  },
  sendButton: {
    backgroundColor: "#205C3B",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
});