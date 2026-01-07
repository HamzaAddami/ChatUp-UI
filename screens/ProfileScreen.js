import React, { useContext, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, 
  ActivityIndicator, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useProfileStore } from '../store/useProfileStore';
import { LogOut, User as UserIcon, Edit2, Save, X, Camera, Shield, ShieldOff } from 'lucide-react-native';

export default function ProfileScreen() {
  const { logout } = useContext(AuthContext);
  
  const {
    profile,
    blockedUsers,
    loading,
    saving,
    loadingBlocked,
    isEditing,
    editData,
    setIsEditing,
    setEditData,
    loadProfile,
    loadBlocked,
    unblockUser,
    saveProfile,
    cancelEdit,
    getUserDisplayName
  } = useProfileStore();

  useEffect(() => {
    loadProfile();
    loadBlocked();
  }, []);

  const handleUnblock = (userId, phoneNumber) => {
    Alert.alert(
      "Débloquer l'utilisateur",
      "Voulez-vous vraiment débloquer cet utilisateur ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Débloquer", 
          style: "default", 
          onPress: () => unblockUser(userId, phoneNumber)
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{flex: 1}}
    >
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {editData.avatarUrl ? (
              <Image source={{ uri: editData.avatarUrl }} style={styles.avatar} />
            ) : (
              <UserIcon size={60} color="#999" />
            )}
            
            {isEditing && (
              <TouchableOpacity style={styles.cameraBadge}>
                <Camera size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

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
            <View style={styles.form}>
              <Text style={styles.label}>Pseudo</Text>
              <TextInput 
                style={styles.input} 
                value={editData.nickname}
                onChangeText={(text) => setEditData({ nickname: text })}
                placeholder="Votre pseudo"
              />

              <Text style={styles.label}>A propos</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={editData.about}
                onChangeText={(text) => setEditData({ about: text })}
                placeholder="Dites quelque chose sur vous..."
                multiline
                numberOfLines={3}
              />
              
              <Text style={styles.label}>URL Avatar (Temporaire)</Text>
              <TextInput 
                style={styles.input} 
                value={editData.avatarUrl}
                onChangeText={(text) => setEditData({ avatarUrl: text })}
                placeholder="https://..."
                autoCapitalize="none"
              />

              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={cancelEdit}>
                  <X size={20} color="#333" />
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={saveProfile} disabled={saving}>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    padding: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  iconBtn: {
    padding: 4,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  infoContainer: {
    gap: 0,
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  blockedList: {
    marginTop: 12,
    gap: 8,
  },
  blockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  blockedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  blockedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  blockedName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  unblockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
  },
  unblockText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  securityNote: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  securityNoteText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});