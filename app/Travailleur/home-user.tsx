import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import BottomTabBar from "../components/BottomTabBar";
import ChatBubble from "../components/ChatBubble";

export default function HomeUser() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://192.168.1.115:5001/api/Alljobs");
        const data = await res.json();
        setJobs(data);
      } catch (e) {
        // Optionnel : afficher une erreur
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        setCurrentUser(JSON.parse(userString));
      }
    };
    getUser();
  }, []);

  const filteredJobs = jobs
  .sort((a, b) => new Date(b.datePostee).getTime() - new Date(a.datePostee).getTime())
  .filter(
    job =>
      (job?.statut || "").toLowerCase() === "ouverte" &&
      (
        (job?.titre || "").toLowerCase().includes(search.toLowerCase()) ||
        (job?.description || "").toLowerCase().includes(search.toLowerCase())
      )
  );


  const handlePressOffer = (item: any) => {
    // Récupère le contexte discussion si on vient de chat ou details
    const senderId = params.senderId ? String(params.senderId) : undefined;
    const conversationId = params.conversationId ? String(params.conversationId) : undefined;
    router.push({
      pathname: "/components/Candidater",
      params: {
        jobId: String(item._id),
        ...(senderId && { senderId }),
        ...(conversationId && { conversationId }),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Ionicons name="briefcase-outline" size={32} color="#205C3B" style={{ marginRight: 8 }} />
        <Text style={styles.logo}>
          Offres d'emploi{currentUser?.prenom ? ` - Bonjour ${currentUser.prenom}` : ""}
        </Text>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#205C3B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un poste, un mot-clé..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading ? (
        <ActivityIndicator color="#205C3B" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={item => item?._id?.toString() || Math.random().toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handlePressOffer(item)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Ionicons name="business-outline" size={22} color="#205C3B" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitle}>{item?.titre || "Sans titre"}</Text>
              </View>
              <Text style={styles.cardDesc} numberOfLines={3}>{item?.description || "Pas de description"}</Text>
              <View style={styles.cardRow}>
                <Ionicons name="pricetag-outline" size={14} color="#205C3B" />
                <Text style={styles.cardMeta}>{item?.categorie || "Non précisée"}</Text>
              </View>
              <View style={styles.cardRow}>
                <Ionicons name="location-outline" size={14} color="#205C3B" />
                <Text style={styles.cardMeta}>{item?.localisation || "Non précisée"}</Text>
              </View>
              <View style={styles.cardRow}>
                <Ionicons name="calendar-outline" size={14} color="#205C3B" />
                <Text style={styles.cardMeta}>
                  {item?.dateMission ? new Date(item.dateMission).toLocaleDateString("fr-FR") : "Date non définie"}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Ionicons name="cash-outline" size={14} color="#205C3B" />
                <Text style={styles.cardMeta}>
                  {item?.remuneration ? `${item.remuneration} €` : "Non précisée"}
                </Text>
              </View>
              <View style={styles.cardRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#205C3B" />
                <Text style={styles.cardMeta}>{item?.statut || "Statut inconnu"}</Text>
              </View>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardUser}>
                    {(item?.userId?.nom || "") + " " + (item?.userId?.prenom || "")}
                  </Text>
                  <Text style={styles.cardEmail}>{item?.userId?.email || ""}</Text>
                </View>
                <Text style={styles.cardDate}>
                  {item?.datePostee ? new Date(item.datePostee).toLocaleDateString("fr-FR") : ""}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: "#888", textAlign: "center", marginTop: 32 }}>
              Aucune offre trouvée.
            </Text>
          }
        />
      )}
      <ChatBubble />
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8F5" , paddingBottom: 60 }, // espace pour la bottom bar
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#205C3B",
    letterSpacing: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#205C3B",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#205C3B",
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#205C3B",
    flex: 1,
  },
  cardDesc: {
    fontSize: 15,
    color: "#333",
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 13,
    color: "#205C3B",
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
  },
  cardUser: {
    fontSize: 14,
    color: "#205C3B",
    fontWeight: "600",
  },
  cardEmail: {
    fontSize: 13,
    color: "#888",
  },
  cardDate: {
    fontSize: 12,
    color: "#aaa",
    marginLeft: 8,
  },
});
