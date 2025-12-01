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
import { customerService } from '@services/customerService';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Users } from 'lucide-react-native';
import { Customer } from '../../../types';

export default function CustomersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customerService.getCustomers({ search }),
  });

  const customers = data?.data || [];

  const renderCustomer = ({ item }: { item: Customer }) => (
    <Card
      style={styles.customerCard}
      onPress={() => router.push(`/crm/customers/${item.id}` as any)}
    >
      <Text style={[styles.customerName, { color: theme.colors.text }]}>
        {item.name}
      </Text>
      {item.email && (
        <Text style={[styles.customerInfo, { color: theme.colors.textSecondary }]}>
          {item.email}
        </Text>
      )}
      {item.phone && (
        <Text style={[styles.customerInfo, { color: theme.colors.textSecondary }]}>
          {item.phone}
        </Text>
      )}
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor:
              item.status === 'ACTIVE'
                ? theme.colors.success + '20'
                : theme.colors.error + '20',
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            {
              color:
                item.status === 'ACTIVE' ? theme.colors.success : theme.colors.error,
            },
          ]}
        >
          {item.status}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Customers</Text>
        <TouchableOpacity
          onPress={() => router.push('/crm/customers/create' as any)}
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
          placeholder="Search customers..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No customers found"
            description="Add your first customer to get started"
            icon={<Users size={48} color={theme.colors.textSecondary} />}
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
  customerCard: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  customerInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

