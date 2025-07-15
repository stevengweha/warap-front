import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import io from "socket.io-client";
import BottomTabBar from "../components/BottomTabBar";

const SOCKET_URL = "https://warap-back.onrender.com";

interface Message {
  _id: string;
  contenu: string;
  dateEnvoi: string;
  senderId: { _id: string };
  receiverId: string;
  jobId: string;
  isMine: boolean;
}

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const router = useRouter();
  const flatListRef = useRef<FlatList<Message>>(null);
  const { senderId, jobId: paramJobId, conversationId } = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const isFocused = useIsFocused();
  const [jobTitle, setJobTitle] = useState<string>("");

  // Récupération de l'utilisateur connecté
  useEffect(() => {
    const getUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        const userId = user._id || user.id || user.userId;
        if (userId) setCurrentUserId(userId.toString());
      }
    };
    getUser();
  }, []);

  // Récupération des messages
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
        const filtered = data.filter(
          (msg: Message) =>
            (msg.senderId._id === currentUserId && msg.receiverId === senderId) ||
            (msg.senderId === senderId && msg.receiverId._id === currentUserId)
        );
        setMessages(filtered.sort((a, b) => new Date(a.dateEnvoi) - new Date(b.dateEnvoi)));
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [paramJobId, senderId, conversationId, currentUserId]);

  // Configuration de Socket.io
  useEffect(() => {
    if (!currentUserId) return;
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("userOnline", { userId: currentUserId });
    });

    socketRef.current.on("userOnlineStatus", (data: { userId: string; online: boolean }) => {
      if (data.userId === senderId) {
        setIsRecipientOnline(data.online);
      }
    });

    socketRef.current.on("typing", (data: { from: string; to: string }) => {
      if (data.from === senderId && data.to === currentUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    socketRef.current.on("messageReceived", (newMessage: Message) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    if (conversationId) {
      socketRef.current.emit("joinConversation", conversationId);
    }

    return () => {
      socketRef.current.disconnect();
    };
  }, [conversationId, currentUserId, senderId]);

  const sendMessage = async () => {
    if (!input.trim() || !currentUserId || !paramJobId || !senderId || sending) {
      return;
    }
    setSending(true);
    const tempId = Date.now().toString();
    const optimisticMsg: Message = {
      _id: tempId,
      contenu: input,
      dateEnvoi: new Date().toISOString(),
      senderId: { _id: currentUserId },
      receiverId: senderId,
      jobId: paramJobId,
      isMine: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");

    try {
      socketRef.current.emit("sendMessage", {
        conversationId,
        message: { senderId: currentUserId, receiverId: senderId, contenu: input, jobId: paramJobId },
      });
      await fetch("https://warap-back.onrender.com/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: senderId,
          contenu: input,
          jobId: paramJobId,
          conversationId,
        }),
      });
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

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
        Discussion pour l'offre {jobTitle || paramJobId} avec {senderId}
        {isRecipientOnline && <Text style={{ color: "#22c55e" }}> ● en ligne</Text>}
      </Text>
      {loading ? (
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.senderId._id === currentUserId ? styles.myMessage : styles.theirMessage]}>
              <Text style={styles.messageText}>{item.contenu}</Text>
              <Text style={styles.date}>{new Date(item.dateEnvoi).toLocaleString("fr-FR")}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 32 }}>Aucun message pour cette conversation.</Text>}
        />
      )}
      {isTyping && <Text style={{ color: "#2563eb" }}>L'utilisateur écrit...</Text>}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity onPress={sendMessage} disabled={sending || !input.trim()}>
            <Text style={{ color: "#fff" }}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8F5", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: "#205C3B", marginBottom: 16 },
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
    color: "#888",
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    color: "#222",
  },
});