import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/Card';
import { EmptyState } from '@components/EmptyState';
import { contactService } from '@services/contactService';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Contact as ContactIcon } from 'lucide-react-native';
import { Contact } from '../../../types';

export default function ContactsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () => contactService.getContacts({ search }),
  });

  const contacts = data?.data || [];

  const renderContact = ({ item }: { item: Contact }) => (
    <Card
      style={styles.contactCard}
      onPress={() => router.push(`/crm/contacts/${item.id}` as any)}
    >
      <Text style={[styles.contactName, { color: theme.colors.text }]}>
        {item.name}
      </Text>
      {item.position && (
        <Text style={[styles.contactPosition, { color: theme.colors.primary }]}>
          {item.position}
        </Text>
      )}
      {item.email && (
        <Text style={[styles.contactInfo, { color: theme.colors.textSecondary }]}>
          {item.email}
        </Text>
      )}
      {item.phone && (
        <Text style={[styles.contactInfo, { color: theme.colors.textSecondary }]}>
          {item.phone}
        </Text>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Contacts</Text>
        <TouchableOpacity
          onPress={() => router.push('/crm/contacts/create' as any)}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search contacts..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No contacts found"
            description="Add your first contact to get started"
            icon={<ContactIcon size={48} color={theme.colors.textSecondary} />}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  contactCard: {
    marginBottom: 12,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPosition: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
});

