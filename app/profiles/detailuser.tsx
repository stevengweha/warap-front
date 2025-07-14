import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";

type User = {
  _id?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  bio?: string;
  competences?: Record<string, any>;
  photoProfil?: string;
  role?: string;
  dateInscription?: string;
  [key: string]: any;
};

export default function DetailUser() {
  const { userId } = useLocalSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!userId) {
          console.log("detailuser.tsx - userId manquant !");
          return;
        }
        // Log pour vérifier la correspondance avec l'id du candidat depuis ManageCandidatures
        console.log("detailuser.tsx - userId reçu (depuis ManageCandidatures):", userId);

        // Vérifie si l'id est bien au format MongoDB (24 caractères hexadécimaux)
        if (typeof userId !== "string" || !/^[a-f\d]{24}$/i.test(userId)) {
          setUser(null);
          setLoading(false);
          return;
        }
        const url = `http://192.168.1.115:5001/api/users/${userId}`;
        const res = await fetch(url);
        if (!res.ok) {
          setUser(null);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#205C3B" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#888" }}>Utilisateur introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          {user.photoProfil && typeof user.photoProfil === "string" && user.photoProfil.trim() !== "" && user.photoProfil !== "null" && user.photoProfil !== "undefined" ? (
            <Image
              source={{
                uri:
                  user.photoProfil.startsWith("http") || user.photoProfil.startsWith("file")
                    ? user.photoProfil
                    : `data:image/jpeg;base64,${user.photoProfil}`,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.noPhoto]}>
              <Text style={styles.noPhotoText}>Pas de photo</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{user.prenom || ""} {user.nom || ""}</Text>
            <Text style={styles.role}>{user.role || ""}</Text>
          </View>
        </View>
        <View style={styles.infoBlock}>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Téléphone" value={user.telephone} />
          <InfoRow label="Adresse" value={user.adresse} />
          <InfoRow label="Date d'inscription" value={user.dateInscription} />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.sectionValue}>{user.bio || "Non renseignée"}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compétences</Text>
          <Text style={styles.sectionValue}>
            {user.competences && Object.keys(user.competences).length > 0
              ? Object.entries(user.competences)
                  .filter(([_, v]) => v && v !== "null" && v !== "undefined")
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")
              : "Non renseignées"}
          </Text>
        </View>
        {/* Affiche dynamiquement toutes les autres propriétés sauf déjà affichées */}
        {Object.entries(user)
          .filter(([k]) =>
            ![
              "_id",
              "nom",
              "prenom",
              "email",
              "photoProfil",
              "role",
              "telephone",
              "adresse",
              "bio",
              "competences",
              "dateInscription",
              "motDePasse"
            ].includes(k)
          )
          .map(([k, v]) =>
            v && v !== "null" && v !== "undefined" ? (
              <View style={styles.section} key={k}>
                <Text style={styles.sectionTitle}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
                <Text style={styles.sectionValue}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</Text>
              </View>
            ) : null
          )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label} :</Text>
      <Text style={styles.infoValue}>{value || "Non renseigné"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F7F8F5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8F5",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 16,
    marginBottom: 32,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
    borderWidth: 2,
    borderColor: "#205C3B",
  },
  noPhoto: {
    borderWidth: 1,
    borderColor: "#aaa",
  },
  noPhotoText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 4,
  },
  role: {
    fontSize: 15,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 2,
  },
  infoBlock: {
    marginBottom: 18,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoLabel: {
    fontWeight: "bold",
    color: "#205C3B",
    width: 120,
  },
  infoValue: {
    color: "#333",
    flex: 1,
  },
  section: {
    marginBottom: 14,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 10,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 2,
    fontSize: 15,
  },
  sectionValue: {
    color: "#333",
    fontSize: 14,
  },
});