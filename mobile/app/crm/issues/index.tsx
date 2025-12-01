import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/Card';
import { EmptyState } from '@components/EmptyState';
import { issueService } from '@services/issueService';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, AlertCircle } from 'lucide-react-native';
import { Issue } from '../../../types';

export default function IssuesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<string>('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['issues', filter],
    queryFn: () =>
      issueService.getIssues({
        status: filter === 'ALL' ? undefined : filter,
      }),
  });

  const issues = data?.data || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return theme.colors.error;
      case 'HIGH':
        return theme.colors.warning;
      case 'MEDIUM':
        return theme.colors.info;
      case 'LOW':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return theme.colors.error;
      case 'IN_PROGRESS':
        return theme.colors.warning;
      case 'RESOLVED':
        return theme.colors.success;
      case 'CLOSED':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderIssue = ({ item }: { item: Issue }) => (
    <Card
      style={styles.issueCard}
      onPress={() => router.push(`/crm/issues/${item.id}` as any)}
    >
      <View style={styles.issueHeader}>
        <Text style={[styles.issueTitle, { color: theme.colors.text }]}>
          {item.title}
        </Text>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) + '20' },
          ]}
        >
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority}
          </Text>
        </View>
      </View>
      <Text
        style={[styles.issueDescription, { color: theme.colors.textSecondary }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>
      <View style={styles.issueFooter}>
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
        <Text style={[styles.issueDate, { color: theme.colors.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Issues</Text>
        <TouchableOpacity
          onPress={() => router.push('/crm/issues/create' as any)}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
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
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={issues}
        renderItem={renderIssue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No issues found"
            description="Report an issue to get started"
            icon={<AlertCircle size={48} color={theme.colors.textSecondary} />}
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
  issueCard: {
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  issueDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  issueDate: {
    fontSize: 12,
  },
});

