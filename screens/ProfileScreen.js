import React, { useContext, useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ActivityIndicator, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { LogOut, User as UserIcon, Edit2, Save, X, Camera, Shield, ShieldOff } from 'lucide-react-native';

export default function ProfileScreen() {
  const { logout, user } = useContext(AuthContext);
  
  // États pour les données
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // États pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nickname: '',
    about: '',
    avatarUrl: ''
  });

  // Ajoutez cet état dans ProfileScreen.js
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    loadProfile();
    loadBlocked();
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

  // Chargez les bloqués au montage
  const loadBlocked = async () => {
    try {
      setLoadingBlocked(true);
      const res = await api.get('/users/blocked');
      
      // Vérifier la structure de la réponse
      console.log("Blocked users response:", res.data);
      
      // S'assurer que c'est bien un tableau
      if (Array.isArray(res.data)) {
        setBlockedUsers(res.data);
      } else if (res.data && typeof res.data === 'object') {
        // Si c'est un objet, essayer de l'extraire
        setBlockedUsers(Object.values(res.data));
      } else {
        setBlockedUsers([]);
      }
    } catch (e) { 
      console.error('Error loading blocked users:', e);
      Alert.alert("Erreur", "Impossible de charger la liste des utilisateurs bloqués");
      setBlockedUsers([]);
    } finally {
      setLoadingBlocked(false);
    }
  };

  // Fonction pour débloquer
  const handleUnblock = async (userId, phoneNumber) => {
    try {
      Alert.alert(
        "Débloquer l'utilisateur",
        "Voulez-vous vraiment débloquer cet utilisateur ?",
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Débloquer", 
            style: "default", 
            onPress: async () => {
              try {
                await api.post('/users/unblock', { 
                  phoneNumber: phoneNumber || userId 
                });
                
                Alert.alert("Succès", "Utilisateur débloqué");
                
                // Mettre à jour la liste localement sans recharger
                setBlockedUsers(prev => prev.filter(u => u.id !== userId));
                
                // Optionnel: recharger la liste complète
                // loadBlocked();
              } catch (unblockError) {
                console.error("Unblock error:", unblockError);
                Alert.alert(
                  "Erreur", 
                  unblockError.response?.data?.error || "Impossible de débloquer cet utilisateur"
                );
              }
            } 
          }
        ]
      );
    } catch (e) { 
      console.error(e);
      Alert.alert("Erreur", "Action impossible");
    }
  };

  // Fonction pour afficher le nom de l'utilisateur
  const getUserDisplayName = (blockedUser) => {
    if (!blockedUser) return "Utilisateur";
    
    // Priorité: nickname > phoneNumber > id
    if (blockedUser.nickname && blockedUser.nickname.trim() !== "") {
      return blockedUser.nickname;
    } else if (blockedUser.phoneNumber) {
      return blockedUser.phoneNumber;
    } else if (blockedUser.id) {
      return `Utilisateur ${blockedUser.id.substring(0, 8)}...`;
    }
    return "Utilisateur";
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

        {/* --- SECTION SÉCURITÉ --- */}
        {!isEditing && (
          <View style={[styles.card, { marginTop: 10 }]}>
            <View style={styles.rowHeader}>
              <Text style={styles.sectionTitle}>Sécurité</Text>
              <TouchableOpacity onPress={loadBlocked} style={styles.iconBtn}>
                <Shield size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.infoLabel}>
              Utilisateurs bloqués ({blockedUsers.length})
            </Text>
            
            {loadingBlocked ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : blockedUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ShieldOff size={40} color="#ccc" />
                <Text style={styles.emptyText}>Aucun utilisateur bloqué</Text>
                <Text style={styles.emptySubtext}>
                  Vous pouvez bloquer des utilisateurs depuis leurs profils de conversation
                </Text>
              </View>
            ) : (
              <View style={styles.blockedList}>
                {blockedUsers.map((blockedUser, index) => (
                  <View key={blockedUser.id || index} style={styles.blockedRow}>
                    <View style={styles.blockedUserInfo}>
                      <View style={styles.blockedAvatar}>
                        {blockedUser.avatarUrl ? (
                          <Image 
                            source={{ uri: blockedUser.avatarUrl }} 
                            style={styles.blockedAvatarImage} 
                          />
                        ) : (
                          <UserIcon size={16} color="#666" />
                        )}
                      </View>
                      <Text style={styles.blockedName} numberOfLines={1}>
                        {getUserDisplayName(blockedUser)}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleUnblock(blockedUser.id, blockedUser.phoneNumber)}
                      style={styles.unblockButton}
                    >
                      <Text style={styles.unblockText}>Débloquer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.securityNote}>
              <Text style={styles.securityNoteText}>
                💡 Les utilisateurs bloqués ne peuvent pas vous envoyer de messages ou voir votre statut en ligne.
              </Text>
            </View>
          </View>
        )}

        {/* --- BOUTON DÉCONNEXION --- */}
        {!isEditing && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={20} color="#FF3B30" style={{ marginRight: 10 }} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#f2f2f7', 
    padding: 20,
    paddingBottom: 40 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  header: { 
    alignItems: 'center', 
    marginBottom: 20, 
    marginTop: 10 
  },
  avatarContainer: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    backgroundColor: '#e1e1e1', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#fff', 
    shadowColor: "#000", 
    shadowOffset: {width: 0, height: 2}, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  avatar: { 
    width: 104, 
    height: 104, 
    borderRadius: 52 
  },
  cameraBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#007AFF', 
    padding: 8, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#fff' 
  },

  card: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 20, 
    marginBottom: 20, 
    shadowColor: "#000", 
    shadowOffset: {width: 0, height: 1}, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 2 
  },
  rowHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  iconBtn: { 
    padding: 5 
  },

  // Styles Lecture
  infoContainer: {},
  infoRow: { 
    paddingVertical: 10 
  },
  infoLabel: { 
    fontSize: 13, 
    color: '#888', 
    marginBottom: 4, 
    textTransform: 'uppercase', 
    fontWeight: '600' 
  },
  infoValue: { 
    fontSize: 16, 
    color: '#333' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#f0f0f0' 
  },

  // Styles Formulaire
  form: { 
    marginTop: 5 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#666', 
    marginBottom: 5, 
    marginTop: 10 
  },
  input: { 
    backgroundColor: '#f9f9f9', 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#eee', 
    fontSize: 16, 
    color: '#333' 
  },
  textArea: { 
    height: 80, 
    textAlignVertical: 'top' 
  },
  
  actionButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 25 
  },
  btn: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 10 
  },
  cancelBtn: { 
    backgroundColor: '#f0f0f0', 
    marginRight: 10 
  },
  cancelText: { 
    color: '#333', 
    fontWeight: '600', 
    marginLeft: 8 
  },
  saveBtn: { 
    backgroundColor: '#007AFF', 
    marginLeft: 10 
  },
  saveText: { 
    color: '#fff', 
    fontWeight: '600', 
    marginLeft: 8 
  },

  logoutBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 30 
  },
  logoutText: { 
    color: '#FF3B30', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

  // Styles pour la section sécurité
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 18,
  },
  blockedList: {
    marginTop: 10,
  },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  blockedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  blockedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  blockedAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  blockedName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  unblockButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unblockText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  securityNote: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  securityNoteText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  }
});