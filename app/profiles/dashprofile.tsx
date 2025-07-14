import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import BottomTabBar from "../components/BottomTabBar";
import LogoutButton from "../components/logout";

type User = {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  adresse: string;
  bio: string;
  competences: Record<string, any>;
  photoProfil?: string;
};

function ProfileEditForm({
  editForm,
  saving,
  handleChange,
  handleSave,
  handleCancel,
}: {
  editForm: Partial<User>;
  saving: boolean;
  handleChange: (key: keyof User, value: string) => void;
  handleSave: () => void;
  handleCancel: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: 220,
          maxWidth: 600,
          alignSelf: "center",
          width: "100%",
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.name}>Modifier mon profil</Text>

      <Text style={styles.label}>Prénom :</Text>
      <TextInput
        style={styles.input}
        value={editForm.prenom || ""}
        onChangeText={(v) => handleChange("prenom", v)}
      />

      <Text style={styles.label}>Nom :</Text>
      <TextInput
        style={styles.input}
        value={editForm.nom || ""}
        onChangeText={(v) => handleChange("nom", v)}
      />

      <Text style={styles.label}>Email :</Text>
      <TextInput
        style={styles.input}
        value={editForm.email || ""}
        onChangeText={(v) => handleChange("email", v)}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Téléphone :</Text>
      <TextInput
        style={styles.input}
        value={editForm.telephone || ""}
        onChangeText={(v) => handleChange("telephone", v)}
      />

      <Text style={styles.label}>Adresse :</Text>
      <TextInput
        style={styles.input}
        value={editForm.adresse || ""}
        onChangeText={(v) => handleChange("adresse", v)}
      />

      <Text style={styles.label}>Bio :</Text>
      <TextInput
        style={[styles.input, { height: 60 }]}
        value={editForm.bio || ""}
        onChangeText={(v) => handleChange("bio", v)}
        multiline
      />

      <View style={styles.editActions}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#aaa" }]}
          onPress={handleCancel}
          disabled={saving}
        >
          <Text style={styles.buttonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (e) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleEdit = () => {
    if (user) {
      setEditForm({ ...user });
      setEditMode(true);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleChange = (key: keyof User, value: string) => {
    setEditForm({ ...editForm, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if ((user as any)?._id) {
        const res = await fetch(
          `https://warap-back.onrender.com/api/users/${(user as any)._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm),
          }
        );
        if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

        const updatedUser = await res.json();
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        await AsyncStorage.setItem("user", JSON.stringify(editForm));
        setUser(editForm as User);
      }
      setEditMode(false);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de sauvegarder les modifications.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPhotoText}>Aucun utilisateur connecté</Text>
        <BottomTabBar />
      </View>
    );
  }

  if (editMode) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F7F8F5" }}>
        <ProfileEditForm
          editForm={editForm}
          saving={saving}
          handleChange={handleChange}
          handleSave={handleSave}
          handleCancel={handleCancel}
        />
        <BottomTabBar />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: 60,
          maxWidth: 600,
          alignSelf: "center",
          width: "100%",
        },
      ]}
    >
      {user.photoProfil &&
      typeof user.photoProfil === "string" &&
      user.photoProfil.trim() !== "" &&
      user.photoProfil !== "null" &&
      user.photoProfil !== "undefined" ? (
        <Image
          source={{
            uri:
              user.photoProfil.startsWith("http") ||
              user.photoProfil.startsWith("file")
                ? user.photoProfil
                : `data:image/jpeg;base64,${user.photoProfil}`,
          }}
          style={styles.avatar}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.avatar, styles.noPhoto]}>
          <Text style={styles.noPhotoText}>Pas de photo disponible</Text>
        </View>
      )}

      <Text style={styles.name}>
        {(user.prenom || "") + " " + (user.nom || "")}
      </Text>
      <Text style={styles.label}>Email :</Text>
      <Text style={styles.value}>{user.email || ""}</Text>
      <Text style={styles.label}>Téléphone :</Text>
      <Text style={styles.value}>{user.telephone || ""}</Text>
      <Text style={styles.label}>Adresse :</Text>
      <Text style={styles.value}>{user.adresse || ""}</Text>
      <Text style={styles.label}>Rôle :</Text>
      <Text style={styles.value}>{(user as any).role || ""}</Text>
      <Text style={styles.label}>Bio :</Text>
      <Text style={styles.value}>{user.bio || ""}</Text>
      <Text style={styles.label}>Compétences :</Text>
      <Text style={styles.value}>
        {user.competences && Object.keys(user.competences).length > 0
          ? Object.entries(user.competences)
              .filter(([_, v]) => v && v !== "null" && v !== "undefined")
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : ""}
      </Text>
      <Text style={styles.label}>Date d'inscription :</Text>
      <Text style={styles.value}>{(user as any).dateInscription || ""}</Text>

      {Object.entries(user)
        .filter(([k]) =>
          ![
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
            "motDePasse",
          ].includes(k)
        )
        .map(([k, v]) =>
          v && v !== "null" && v !== "undefined" ? (
            <React.Fragment key={k}>
              <Text style={styles.label}>
                {k.charAt(0).toUpperCase() + k.slice(1)} :
              </Text>
              <Text style={styles.value}>
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </Text>
            </React.Fragment>
          ) : null
        )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={handleEdit}>
          <Text style={styles.buttonText}>Modifier mes infos</Text>
        </TouchableOpacity>
        <LogoutButton />
      </View>

      <BottomTabBar />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F7F8F5",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 16,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
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
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 8,
  },
  label: {
    fontWeight: "bold",
    color: "#205C3B",
    alignSelf: "flex-start",
    marginLeft: 10,
    marginTop: 6,
  },
  value: {
    color: "#333",
    alignSelf: "flex-start",
    marginLeft: 10,
    marginBottom: 2,
  },
  actions: {
    width: "100%",
    marginTop: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#205C3B",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#205C3B",
    color: "#205C3B",
    marginBottom: 12,
    width: "100%",
  },
  editActions: {
    width: "100%",
    marginTop: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
});
