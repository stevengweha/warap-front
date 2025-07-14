import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type HistoryItem = { type: "text"; content: string } | { type: "image"; uri: string };

export default function ChatBubble() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (message.trim()) {
      setHistory([...history, { type: "text", content: "Vous: " + message }]);
      setSending(true);
      setTimeout(() => {
        setHistory((h) => [...h, { type: "text", content: "IA: Merci pour votre message !" }]);
        setSending(false);
      }, 500);
      setMessage("");
    }
  };

  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const uri = res.assets[0].uri;
      setHistory([...history, { type: "image", uri }]);
      setSending(true);
      setTimeout(() => {
        setHistory((h) => [
          ...h,
          { type: "text", content: "IA: Belle image ! (simulation)" },
        ]);
        setSending(false);
      }, 500);
    }
  };

  return (
    <>
      <View pointerEvents="box-none" style={styles.floatingContainer}>
        <TouchableOpacity
          style={styles.chatBubble}
          onPress={() => setVisible(true)}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          >
            <View style={styles.popup}>
              <View style={styles.popupHeader}>
                <Text style={styles.popupTitle}>Discuter avec l'IA</Text>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Ionicons name="close" size={24} color="#205C3B" />
                </TouchableOpacity>
              </View>
              <View style={styles.history}>
                {history.map((item, idx) =>
                  item.type === "text" ? (
                    <Text key={idx} style={styles.historyText}>
                      {item.content}
                    </Text>
                  ) : (
                    <View key={idx} style={styles.imageRow}>
                      <Image source={{ uri: item.uri }} style={styles.imagePreview} />
                      <Text style={styles.historyText}>Vous: [Image]</Text>
                    </View>
                  )
                )}
                {sending && (
                  <Text style={[styles.historyText, { color: "#888" }]}>IA est en train d'écrire...</Text>
                )}
              </View>
              <View style={styles.inputRow}>
                <TouchableOpacity style={styles.imageBtn} onPress={handlePickImage}>
                  <Ionicons name="image" size={22} color="#205C3B" />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="Votre message..."
                  value={message}
                  onChangeText={setMessage}
                  placeholderTextColor="#888"
                  multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!message.trim()}>
                  <Ionicons name="send" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    right: 24,
    bottom: 96, // pour ne pas recouvrir la BottomTabBar
    zIndex: 200,
    elevation: 20,
    pointerEvents: "box-none",
  },
  chatBubble: {
    backgroundColor: "#205C3B",
    borderRadius: 32,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  popup: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 320,
    maxHeight: "70%",
  },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#205C3B",
  },
  history: {
    flex: 1,
    marginVertical: 8,
    maxHeight: 140,
  },
  historyText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  imagePreview: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#205C3B",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F7F8F5",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#205C3B",
    color: "#205C3B",
    marginRight: 8,
    minHeight: 40,
    maxHeight: 80,
  },
  sendBtn: {
    backgroundColor: "#205C3B",
    borderRadius: 24,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  imageBtn: {
    backgroundColor: "#F7F8F5",
    borderRadius: 24,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#205C3B",
  },
});
