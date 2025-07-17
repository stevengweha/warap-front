import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
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
  View,
} from "react-native";
import BottomTabBar from "../components/BottomTabBar";
import LogoutButton from "../components/logout";

type User = {
  _id?: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  telephone: string;
  adresse: string;
  bio: string;
  competences: string;
  photoProfil?: string;
};

const getPhotoUri = (photoProfil?: string) => {
  if (!photoProfil) return "";
  if (photoProfil.startsWith("http")) return photoProfil;
  if (photoProfil.startsWith("data:image")) return photoProfil;
  return `data:image/jpeg;base64,${photoProfil}`;
};

function ProfileEditForm({
  editForm,
  saving,
  handleChange,
  handleSave,
  handleCancel,
  pickImage,
}: {
  editForm: Partial<User>;
  saving: boolean;
  handleChange: (key: keyof User, value: string) => void;
  handleSave: () => void;
  handleCancel: () => void;
  pickImage: () => Promise<void>;
}) {
  const editableFields: (keyof User)[] = [
    "nom",
    "prenom",
    "email",
    "telephone",
    "adresse",
    "competences",
    "bio",
  ];

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: 240 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Modifier mon profil</Text>

      <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
        {editForm.photoProfil ? (
          <Image
            source={{ uri: getPhotoUri(editForm.photoProfil) }}
            style={styles.photo}
          />
        ) : (
          <View style={[styles.photo, styles.noPhoto]}>
            <Text style={styles.noPhotoText}>Ajouter une photo</Text>
          </View>
        )}
        <Text style={styles.changePhotoText}>Changer la photo</Text>
      </TouchableOpacity>

      {editableFields.map((key) => (
        <View key={key} style={styles.fieldContainer}>
          <Text style={styles.label}>
            {key.charAt(0).toUpperCase() + key.slice(1)} :
          </Text>
          <TextInput
            style={[styles.input, key === "bio" && styles.textArea]}
            value={editForm[key] as string}
            onChangeText={(v) => handleChange(key, v)}
            multiline={key === "bio" || key === "competences"}
            placeholder={`Ex: ${
              key === "competences" ? "React, Node.js, Design..." : ""
            }`}
          />
        </View>
      ))}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.saveButton}
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
          style={styles.cancelButton}
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
    AsyncStorage.getItem("user")
      .then((u) => {
        if (u) setUser(JSON.parse(u));
      })
      .catch(() => setUser(null));
  }, []);

  const handleEdit = () => {
    if (user) setEditForm({ ...user });
    setEditMode(true);
  };

  const handleCancel = () => setEditMode(false);

  const handleChange = (key: keyof User, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

 const pickImage = async () => {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: false,
    base64: true,  // <-- IMPORTANT pour récupérer le base64
  });

  if (!res.canceled && res.assets && res.assets.length > 0) {
    // expo-image-picker v14+ structure assets comme un tableau
    const asset = res.assets[0];
    if (asset.base64) {
      // stocker la chaîne base64 directement (sans préfixe)
      handleChange("photoProfil", asset.base64);
    } else if (asset.uri) {
      // fallback si base64 absent : stocker URI (pour mobile natif)
      handleChange("photoProfil", asset.uri);
    }
  }
};


 const handleSave = async () => {
  setSaving(true);
  try {
    if (user?._id) {
      // Préparer payload avec base64 bien formaté si besoin
      const payload = {
        ...editForm,
        photoProfil:
          editForm.photoProfil && !editForm.photoProfil.startsWith("data:")
            ? `data:image/jpeg;base64,${editForm.photoProfil}`
            : editForm.photoProfil,
      };

      const res = await fetch(
        `https://warap-back.onrender.com/api/users/${user._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error();
      const updated = await res.json();
      await AsyncStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    } else {
      await AsyncStorage.setItem("user", JSON.stringify(editForm));
      setUser(editForm as User);
    }
    setEditMode(false);
  } catch {
    Alert.alert("Erreur", "Échec de la sauvegarde.");
  } finally {
    setSaving(false);
  }
};


  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <BottomTabBar />
      </View>
    );
  }

  if (editMode) {
    return (
      <View style={styles.flexContainer}>
        <ProfileEditForm
          editForm={editForm}
          saving={saving}
          handleChange={handleChange}
          handleSave={handleSave}
          handleCancel={handleCancel}
          pickImage={pickImage}
        />
        <BottomTabBar />
      </View>
    );
  }

  return (
    <View style={styles.flexContainer}>
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
        {user.photoProfil && user.photoProfil.trim() !== "" ? (
          <Image
            source={{ uri: getPhotoUri(user.photoProfil) }}
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
          {user.competences
            ? Array.isArray(user.competences)
              ? user.competences.join(", ")
              : typeof user.competences === "object"
              ? Object.entries(user.competences)
                  .filter(([_, v]) => v && v !== "null" && v !== "undefined")
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ")
              : user.competences
            : ""}
        </Text>
        <Text style={styles.label}>Date d'inscription :</Text>
        <Text style={styles.value}>{(user as any).dateInscription || ""}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleEdit}>
            <Text style={styles.buttonText}>Modifier</Text>
          </TouchableOpacity>
          <LogoutButton />
        </View>
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1, backgroundColor: "#F7F8F5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: "#eee",
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#eee",
  },
  noPhoto: {
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#aaa",
    borderWidth: 1,
  },
  noPhotoText: { color: "#888", textAlign: "center" },
  changePhotoText: {
    color: "#205C3B",
    marginTop: 8,
    textDecorationLine: "underline",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#205C3B",
    marginBottom: 12,
  },
  label: {
    fontWeight: "bold",
    color: "#205C3B",
    alignSelf: "flex-start",
    marginLeft: 10,
    marginTop: 6,
  },
  fieldContainer: {
    width: "100%",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderColor: "#205C3B",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: "#205C3B",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#205C3B",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: "#aaa",
    padding: 14,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 24,
    width: "100%",
  },
  value: {
    color: "#333",
    alignSelf: "flex-start",
    marginLeft: 10,
    marginBottom: 2,
  },
});
