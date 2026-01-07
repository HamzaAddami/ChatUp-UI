import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useContactsStore } from '../store/useContactsStore';
import { UserPlus, MessageSquare, Search, X, Users, UserCheck } from 'lucide-react-native';

export default function ContactsScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('local');
  const [addingUserId, setAddingUserId] = useState(null); 

  const {
    contacts,
    loading,
    adding,
    searching,
    searchResults,
    loadContacts,
    addContact,
    addUserAsContact,
    searchUsers,
    clearSearchResults,
    startPrivateConversation,
    searchLocalContacts,
    isUserInContacts
  } = useContactsStore();

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchMode === 'global' && searchQuery) {
      const timer = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500);

      return () => clearTimeout(timer);
    } else if (!searchQuery) {
      clearSearchResults();
    }
  }, [searchQuery, searchMode]);

  const handleAddContact = async () => {
    const success = await addContact(phone);
    if (success) {
      setPhone('');
    }
  };

  const handleAddUserFromSearch = async (user) => {
    setAddingUserId(user.id);
    const success = await addUserAsContact(user.phoneNumber);
    setAddingUserId(null);
    
    if (success) {
      setSearchQuery('');
      clearSearchResults();
      setSearchMode('local');
    }
  };

  const handleStartChat = async (contact) => {
    const result = await startPrivateConversation(contact);
    if (result.success) {
      navigation.navigate('Chat', { 
        conversationId: result.conversationId, 
        name: result.contactName 
      });
    }
  };

  const toggleSearchMode = () => {
    const newMode = searchMode === 'local' ? 'global' : 'local';
    setSearchMode(newMode);
    setSearchQuery('');
    clearSearchResults();
  };

  const displayData = searchMode === 'global' 
    ? searchResults 
    : (searchQuery ? searchLocalContacts(searchQuery) : contacts);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <View style={styles.addSection}>
        <Text style={styles.label}>Ajouter un contact par numéro :</Text>
        <View style={styles.inputRow}>
          <TextInput 
            style={styles.input} 
            value={phone} 
            onChangeText={setPhone} 
            placeholder="+2126..." 
            keyboardType="phone-pad"
            editable={!adding}
          />
          <TouchableOpacity 
            style={[styles.addBtn, adding && styles.addBtnDisabled]} 
            onPress={handleAddContact}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <UserPlus color="#fff" size={24} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchHeader}>
          <Text style={styles.searchModeLabel}>
            {searchMode === 'local' ? '📋 Mes contacts' : '🌐 Recherche globale'}
          </Text>
          <TouchableOpacity 
            style={styles.toggleBtn}
            onPress={toggleSearchMode}
          >
            {searchMode === 'local' ? (
              <Users size={20} color="#007AFF" />
            ) : (
              <UserCheck size={20} color="#007AFF" />
            )}
            <Text style={styles.toggleText}>
              {searchMode === 'local' ? 'Chercher partout' : 'Mes contacts'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              searchMode === 'local' 
                ? "Rechercher dans mes contacts..." 
                : "Rechercher par nom ou numéro..."
            }
            placeholderTextColor="#999"
          />
          {(searchQuery || searching) && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                clearSearchResults();
              }}
              style={styles.clearBtn}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#999" />
              ) : (
                <X size={20} color="#999" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && contacts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des contacts...</Text>
        </View>
      ) : displayData.length === 0 ? (
        <View style={styles.emptyContainer}>
          {searchMode === 'global' && searchQuery ? (
            <>
              <Search size={50} color="#ccc" />
              <Text style={styles.emptyText}>
                {searching ? "Recherche en cours..." : "Aucun utilisateur trouvé"}
              </Text>
              <Text style={styles.emptySubtext}>
                Essayez avec un numéro de téléphone complet ou un pseudo exact
              </Text>
            </>
          ) : (
            <>
              <UserPlus size={50} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? "Aucun contact trouvé" 
                  : "Aucun contact pour le moment"
                }
              </Text>
              {!searchQuery && (
                <Text style={styles.emptySubtext}>
                  Ajoutez votre premier contact ci-dessus ou utilisez la recherche globale
                </Text>
              )}
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id}
          refreshControl={
            searchMode === 'local' ? (
              <RefreshControl 
                refreshing={loading}
                onRefresh={loadContacts}
                colors={['#007AFF']}
              />
            ) : null
          }
          renderItem={({ item }) => {
            const isAlreadyContact = isUserInContacts(item.id);
            const isSearchResult = searchMode === 'global';
            const isBeingAdded = addingUserId === item.id;

            return (
              <TouchableOpacity 
                style={styles.item} 
                onPress={() => {
                  if (!isSearchResult || isAlreadyContact) {
                    handleStartChat(item);
                  }
                }}
                activeOpacity={isSearchResult && !isAlreadyContact ? 1 : 0.7}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.nickname?.[0]?.toUpperCase() || item.phoneNumber?.[0] || "#"}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.nickname || "Sans nom"}
                  </Text>
                  <Text style={styles.phoneItem} numberOfLines={1}>
                    {item.phoneNumber}
                  </Text>
                  {isAlreadyContact && isSearchResult && (
                    <Text style={styles.alreadyContactBadge}>✓ Déjà dans vos contacts</Text>
                  )}
                </View>
                
                {isSearchResult && !isAlreadyContact ? (
                  <TouchableOpacity 
                    style={[
                      styles.addFromSearchBtn,
                      isBeingAdded && styles.addFromSearchBtnDisabled
                    ]}
                    onPress={() => handleAddUserFromSearch(item)}
                    disabled={isBeingAdded}
                  >
                    {isBeingAdded ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <UserPlus color="#007AFF" size={20} />
                    )}
                  </TouchableOpacity>
                ) : (
                  <MessageSquare color="#007AFF" size={20} />
                )}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  addSection: { 
    padding: 20, 
    backgroundColor: '#f9f9f9', 
    borderBottomWidth: 1, 
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  label: { 
    marginBottom: 10, 
    fontWeight: '600', 
    color: '#333',
    fontSize: 15,
  },
  inputRow: { 
    flexDirection: 'row', 
    gap: 10 
  },
  input: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12,
    fontSize: 16,
  },
  addBtn: { 
    backgroundColor: '#28a745', 
    padding: 12, 
    borderRadius: 8, 
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  addBtnDisabled: {
    backgroundColor: '#9ed5a8',
    opacity: 0.7,
  },
  searchSection: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchModeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  toggleText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  clearBtn: {
    padding: 4,
  },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15,
    backgroundColor: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 70,
  },
  avatar: { 
    width: 45, 
    height: 45, 
    borderRadius: 22.5, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  avatarText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  contactInfo: {
    flex: 1,
    marginRight: 10,
  },
  name: { 
    fontWeight: '600', 
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  phoneItem: { 
    color: '#666', 
    fontSize: 13 
  },
  alreadyContactBadge: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '500',
    marginTop: 2,
  },
  addFromSearchBtn: {
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addFromSearchBtnDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});