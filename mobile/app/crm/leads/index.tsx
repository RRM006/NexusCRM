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
import { leadService } from '@services/leadService';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, UserPlus } from 'lucide-react-native';
import { Lead } from '../../../types';

export default function LeadsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads', search, filter],
    queryFn: () =>
      leadService.getLeads({
        search,
        status: filter === 'ALL' ? undefined : filter,
      }),
  });

  const leads = data?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return theme.colors.info;
      case 'CONTACTED':
        return theme.colors.warning;
      case 'QUALIFIED':
        return theme.colors.primary;
      case 'CONVERTED':
        return theme.colors.success;
      case 'LOST':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderLead = ({ item }: { item: Lead }) => (
    <Card
      style={styles.leadCard}
      onPress={() => router.push(`/crm/leads/${item.id}` as any)}
    >
      <View style={styles.leadHeader}>
        <Text style={[styles.leadName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      {item.email && (
        <Text style={[styles.leadInfo, { color: theme.colors.textSecondary }]}>
          {item.email}
        </Text>
      )}
      {item.phone && (
        <Text style={[styles.leadInfo, { color: theme.colors.textSecondary }]}>
          {item.phone}
        </Text>
      )}
      {item.source && (
        <Text style={[styles.leadSource, { color: theme.colors.textSecondary }]}>
          Source: {item.source}
        </Text>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Leads</Text>
        <TouchableOpacity
          onPress={() => router.push('/crm/leads/create' as any)}
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
          placeholder="Search leads..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            style={[
              styles.filterTab,
              filter === status && { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filter === status ? '#ffffff' : theme.colors.textSecondary,
                },
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={leads}
        renderItem={renderLead}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No leads found"
            description="Create your first lead to get started"
            icon={<UserPlus size={48} color={theme.colors.textSecondary} />}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  leadCard: {
    marginBottom: 12,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  leadInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  leadSource: {
    fontSize: 12,
    marginTop: 4,
  },
});

