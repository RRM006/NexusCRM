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
import { Button } from '@components/Button';
import { EmptyState } from '@components/EmptyState';
import { taskService } from '@services/taskService';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CheckSquare, Circle, Clock } from 'lucide-react-native';
import { Task } from '../../types';

export default function TasksScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => taskService.getTasks({ status: filter === 'ALL' ? undefined : filter }),
  });

  const tasks = data?.data || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return theme.colors.error;
      case 'MEDIUM':
        return theme.colors.warning;
      case 'LOW':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckSquare size={20} color={theme.colors.success} />;
      case 'IN_PROGRESS':
        return <Clock size={20} color={theme.colors.warning} />;
      default:
        return <Circle size={20} color={theme.colors.textSecondary} />;
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <Card
      style={styles.taskCard}
      onPress={() => router.push(`/tasks/${item.id}` as any)}
    >
      <View style={styles.taskHeader}>
        {getStatusIcon(item.status)}
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          {item.description && (
            <Text
              style={[styles.taskDescription, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.taskFooter}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority}
          </Text>
        </View>
        {item.dueDate && (
          <Text style={[styles.dueDate, { color: theme.colors.textSecondary }]}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Tasks</Text>
        <TouchableOpacity
          onPress={() => router.push('/tasks/create' as any)}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status as any)}
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
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No tasks found"
            description="Create your first task to get started"
            icon={<CheckSquare size={48} color={theme.colors.textSecondary} />}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 12,
  },
});

