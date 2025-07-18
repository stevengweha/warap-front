import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

// Ajoute cette fonction utilitaire pour le web
const getBase64FromUriWeb = (uri: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
          // On retire le préfixe si besoin
          let result = reader.result as string;
          if (result.startsWith("data:image")) {
            // On ne garde que la partie base64 si besoin
            result = result;
          }
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = reject;
      xhr.open("GET", uri);
      xhr.responseType = "blob";
      xhr.send();
    } catch (e) {
      reject(e);
    }
  });
};

const getPhotoUri = (photoProfil?: string) => {
  if (!photoProfil) return "";
  if (photoProfil.startsWith("http")) return photoProfil;
  if (photoProfil.startsWith("data:image")) return photoProfil;
  return `data:image/jpeg;base64,${photoProfil}`;
};

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("user")
      .then((u) => {
        if (u) {
          const parsed = JSON.parse(u);
          setUser(parsed);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, []);

  const fetchUserFromApi = async (id: string) => {
    try {
      const res = await fetch(`https://warap-back.onrender.com/api/users/${id}`);
      if (!res.ok) throw new Error("Erreur API");
      const freshUser = await res.json();
      setUser(freshUser);
      await AsyncStorage.setItem("user", JSON.stringify(freshUser));
      return freshUser;
    } catch (e) {
      console.log("Erreur lors du fetch user API :", e);
      return null;
    }
  };

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
      allowsEditing: true,
      base64: false, // on va générer le base64 après compression
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      let base64Photo = "";
      if (Platform.OS === "web") {
        base64Photo = await getBase64FromUriWeb(manipulated.uri);
        // base64Photo est déjà au format data:image/jpeg;base64,...
        // On retire le préfixe si besoin pour l'affichage local
        setEditForm((prev) => ({
          ...prev,
          photoProfil: base64Photo,
        }));
      } else {
        // Sur mobile, on lit le fichier compressé en base64
        const base64 = await FileSystem.readAsStringAsync(manipulated.uri, { encoding: FileSystem.EncodingType.Base64 });
        setEditForm((prev) => ({
          ...prev,
          photoProfil: base64,
        }));
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?._id || user?.id) {
        // Prépare le bon id (car parfois c'est id, parfois _id)
        const userId = user._id || user.id;
        let photoProfilToSend = editForm.photoProfil;
        if (editForm.photoProfil) {
          if (Platform.OS === "web") {
            if (!editForm.photoProfil.startsWith("data:image")) {
              photoProfilToSend = `data:image/jpeg;base64,${editForm.photoProfil}`;
            }
          } else {
            if (!editForm.photoProfil.startsWith("data:image")) {
              photoProfilToSend = `data:image/jpeg;base64,${editForm.photoProfil}`;
            }
          }
        }

        const payload = {
          ...editForm,
          photoProfil: photoProfilToSend,
        };

        const res = await fetch(
          `https://warap-back.onrender.com/api/users/${userId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erreur API");
        }
        // Met à jour AsyncStorage avec la nouvelle version du user
        const updatedUser = await res.json();
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditMode(false);
      }
    } catch (e) {
      Alert.alert("Erreur", "Échec de la sauvegarde.");
      console.log("Erreur lors de la sauvegarde :", e);
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
      {/* MODAL EDIT WEB FRIENDLY */}
      <Modal
        visible={editMode}
        animationType="fade"
        transparent
        onRequestClose={handleCancel}
      >
        <View style={styles.webModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{
              flex: 1,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={styles.webModalContent}>
              <ScrollView
                contentContainerStyle={styles.webModalScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
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
                {["nom", "prenom", "telephone", "adresse", "competences", "bio"].map((key) => (
                  <View key={key} style={styles.fieldContainer}>
                    <Text style={styles.label}>
                      {key.charAt(0).toUpperCase() + key.slice(1)} :
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        (key === "bio" || key === "competences") && styles.textArea,
                      ]}
                      value={editForm[key as keyof User] as string}
                      onChangeText={(v) => handleChange(key as keyof User, v)}
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
                    {console.log("Bouton Enregistrer rendu, saving =", saving)}
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
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    textAlign: "center",
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    width: "100%",
    maxWidth: 400,
    padding: 18,
    elevation: 6,
  },
  webModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    width: "100%",
    minHeight: "100%",
  },
  webModalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    width: "95%",
    maxWidth: 420,
    maxHeight: "90%",
    padding: 18,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    alignSelf: "center",
    justifyContent: "center",
  },
  webModalScroll: {
    paddingBottom: 24,
    alignItems: "center",
    flexGrow: 1,
  },
});

