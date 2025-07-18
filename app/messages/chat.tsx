import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
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

export default function ChatView() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [seenMessageId, setSeenMessageId] = useState(null);
  const router = useRouter();
  const flatListRef = useRef(null);
  const { senderId, jobId: paramJobId, conversationId } = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState(null);
  const socketRef = useRef(null);
  const isFocused = useIsFocused();
  const [jobTitle, setJobTitle] = useState("");

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

  useEffect(() => {
    if (!currentUserId) return;
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("userOnline", { userId: currentUserId });
    });

    socketRef.current.on("userOnlineStatus", (data) => {
      if (data.userId === senderId) {
        setIsRecipientOnline(data.online);
      }
    });

    socketRef.current.on("typing", (data) => {
      if (data.from === senderId && data.to === currentUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    socketRef.current.on("seen", (data) => {
      if (data.userId === senderId) {
        setSeenMessageId(data.messageId);
      }
    });

    socketRef.current.on("newMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    if (conversationId) {
      socketRef.current.emit("joinConversation", conversationId);
    }
    socketRef.current.emit("checkUserOnline", { userId: senderId });

    return () => {
      socketRef.current.disconnect();
    };
  }, [conversationId, currentUserId, senderId]);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          conversationId
            ? `${SOCKET_URL}/api/messages/job/${paramJobId}?conversationId=${conversationId}`
            : `${SOCKET_URL}/api/messages/job/${paramJobId}`
        );
        const data = await res.json();
        const filtered = data.filter((msg) => {
          const sender = msg.senderId?._id || msg.senderId;
          const receiver = msg.receiverId?._id || msg.receiverId;
          return (
            (sender === currentUserId && receiver === senderId) ||
            (sender === senderId && receiver === currentUserId)
          );
        });
        setMessages(
          filtered.sort(
            (a, b) => new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime()
          )
        );
      } catch (e) {
        setMessages([]);
      }
    };

    fetchMessages();
  }, [paramJobId, senderId, conversationId, currentUserId]);

  const sendMessage = async () => {
    if (!input.trim() || !currentUserId || !paramJobId || !senderId || sending) return;

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
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    Keyboard.dismiss();

    try {
      if (conversationId && socketRef.current?.connected) {
        socketRef.current.emit("receiveMessage", {
          conversationId,
          message: optimisticMsg,
        });
      }

      await fetch(`${SOCKET_URL}/api/messages`, {
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
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleInputChange = (text) => {
    setInput(text);
    if (socketRef.current?.connected && text.trim()) {
      socketRef.current.emit("typing", { from: currentUserId, to: senderId });
    }
  };

  useEffect(() => {
    if (messages.length && currentUserId && senderId && socketRef.current?.connected) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.receiverId?._id === currentUserId && lastMsg.senderId?._id === senderId) {
        socketRef.current.emit("seen", { messageId: lastMsg._id, userId: currentUserId });
      }
    }
  }, [messages]);

  const recipient =
    messages.length > 0
      ? messages[0].senderId._id === currentUserId
        ? messages[0].receiverId
        : messages[0].senderId
      : null;

  useEffect(() => {
    const fetchJobTitle = async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/api/jobs/${paramJobId}`);
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

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>
          Discussion pour l'offre {jobTitle || paramJobId} avec {recipient?.nom || "Expéditeur inconnu"} {recipient?.prenom || ""} {" "}
          {isRecipientOnline && <Text style={{ color: "#22c55e", fontSize: 14 }}> ● en ligne</Text>}
        </Text>

        <TouchableOpacity
          style={styles.jobLink}
          onPress={() => router.push({ pathname: "/components/offerdetails", params: { jobId: paramJobId, senderId, conversationId } })}
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
              <Text style={styles.messageText}>{item.contenu}</Text>
              <Text style={styles.date}>
                {new Date(item.dateEnvoi).toLocaleString("fr-FR")}
                {item._id === seenMessageId && item.senderId?._id === currentUserId && (
                  <Text style={{ color: "#22c55e", fontSize: 11 }}> ● Vu</Text>
                )}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            editable={!sending}
            multiline
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={sending || !input.trim()}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Envoyer</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
      <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            value={input}
            onChangeText={handleInputChange}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            editable={!sending}
            multiline
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={sending || !input.trim()}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F5",
    padding: 16,
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
