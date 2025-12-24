import React, { useContext, useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ActivityIndicator, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, User as UserIcon, Edit2, Save, X, Camera } from 'lucide-react-native';

export default function ProfileScreen() {
  const { logout } = useContext(AuthContext);
  
  // États pour les données
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // États pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nickname: '',
    about: '',
    avatarUrl: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me');
      setProfile(res.data);
      // On initialise les données d'édition avec les données actuelles
      setEditData({
        nickname: res.data.nickname || '',
        about: res.data.about || '',
        avatarUrl: res.data.avatarUrl || ''
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editData.nickname.trim()) {
      Alert.alert("Erreur", "Le pseudo ne peut pas être vide.");
      return;
    }

    setSaving(true);
    try {
      // Appel à ton endpoint C# [HttpPut("profile")]
      await api.put('/users/profile', {
        nickname: editData.nickname,
        about: editData.about,
        avatarUrl: editData.avatarUrl
      });

      // Mise à jour locale pour éviter de recharger tout
      setProfile({ ...profile, ...editData });
      setIsEditing(false);
      Alert.alert("Succès", "Profil mis à jour !");
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Échec de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    // On remet les valeurs d'origine
    setEditData({
      nickname: profile.nickname || '',
      about: profile.about || '',
      avatarUrl: profile.avatarUrl || ''
    });
    setIsEditing(false);
  };

  // Ajoutez cet état dans ProfileScreen.js
const [blockedUsers, setBlockedUsers] = useState([]);

// Chargez les bloqués au montage
const loadBlocked = async () => {
    try {
        const res = await api.get('/users/blocked');
        setBlockedUsers(res.data);
    } catch (e) { console.error(e); }
};

// Fonction pour débloquer
const handleUnblock = async (phoneNumber) => {
    try {
        await api.post('/users/unblock', { phoneNumber });
        Alert.alert("Succès", "Utilisateur débloqué");
        loadBlocked(); // Recharger la liste
    } catch (e) { Alert.alert("Erreur", "Action impossible"); }
};

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF"/></View>;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{flex: 1}}
    >
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* --- HEADER (AVATAR) --- */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {editData.avatarUrl ? (
              <Image source={{ uri: editData.avatarUrl }} style={styles.avatar} />
            ) : (
              <UserIcon size={60} color="#999" />
            )}
            
            {/* Petit bouton caméra (simulation pour l'instant) */}
            {isEditing && (
              <TouchableOpacity style={styles.cameraBadge}>
                <Camera size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* --- FORMULAIRE / INFO --- */}
        <View style={styles.card}>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionTitle}>Informations Personnelles</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconBtn}>
                <Edit2 size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            // MODE ÉDITION
            <View style={styles.form}>
              <Text style={styles.label}>Pseudo</Text>
              <TextInput 
                style={styles.input} 
                value={editData.nickname}
                onChangeText={(text) => setEditData({...editData, nickname: text})}
                placeholder="Votre pseudo"
              />

              <Text style={styles.label}>A propos</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={editData.about}
                onChangeText={(text) => setEditData({...editData, about: text})}
                placeholder="Dites quelque chose sur vous..."
                multiline
                numberOfLines={3}
              />
              
              <Text style={styles.label}>URL Avatar (Temporaire)</Text>
              <TextInput 
                style={styles.input} 
                value={editData.avatarUrl}
                onChangeText={(text) => setEditData({...editData, avatarUrl: text})}
                placeholder="https://..."
                autoCapitalize="none"
              />

              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={cancelEdit}>
                  <X size={20} color="#333" />
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Save size={20} color="#fff" />
                      <Text style={styles.saveText}>Enregistrer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // MODE LECTURE
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pseudo</Text>
                <Text style={styles.infoValue}>{profile?.nickname || "Non défini"}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{profile?.phoneNumber}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>A propos</Text>
                <Text style={styles.infoValue}>{profile?.about || "Aucune description"}</Text>
              </View>
            </View>
          )}
        </View>

        {/* --- BOUTON DÉCONNEXION --- */}
        {!isEditing && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={20} color="#FF3B30" style={{ marginRight: 10 }} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        )}

        {!isEditing && (
  <View style={[styles.card, { marginTop: 10 }]}>
    <Text style={styles.sectionTitle}>Sécurité</Text>
    <Text style={styles.infoLabel}>Utilisateurs bloqués ({blockedUsers.length})</Text>
    
    {blockedUsers.length === 0 ? (
      <Text style={styles.emptyText}>Aucun utilisateur bloqué</Text>
    ) : (
      blockedUsers.map((u) => (
        <View key={u.id} style={styles.blockedRow}>
          <Text style={styles.blockedName}>{u.nickname || u.phoneNumber}</Text>
          <TouchableOpacity onPress={() => handleUnblock(u.phoneNumber)}>
            <Text style={styles.unblockText}>Débloquer</Text>
          </TouchableOpacity>
        </View>
      ))
    )}
  </View>
)}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f2f2f7', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  avatarContainer: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  avatar: { width: 104, height: 104, borderRadius: 52 },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  iconBtn: { padding: 5 },

  // Styles Lecture
  infoContainer: {},
  infoRow: { paddingVertical: 10 },
  infoLabel: { fontSize: 13, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: '600' },
  infoValue: { fontSize: 16, color: '#333' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },

  // Styles Formulaire
  form: { marginTop: 5 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', fontSize: 16, color: '#333' },
  textArea: { height: 80, textAlignVertical: 'top' },
  
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 10 },
  cancelBtn: { backgroundColor: '#f0f0f0', marginRight: 10 },
  cancelText: { color: '#333', fontWeight: '600', marginLeft: 8 },
  saveBtn: { backgroundColor: '#007AFF', marginLeft: 10 },
  saveText: { color: '#fff', fontWeight: '600', marginLeft: 8 },

  logoutBtn: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' }
});