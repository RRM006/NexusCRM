import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/Card';
import { EmptyState } from '@components/EmptyState';
import { activityService } from '@services/activityService';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Activity as ActivityIcon, Phone, Mail, Calendar, FileText, CheckSquare } from 'lucide-react-native';
import { Activity } from '../../../types';

export default function ActivitiesScreen() {
  const { theme } = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityService.getActivities({}),
  });

  const activities = data?.data || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <Phone size={20} color={theme.colors.primary} />;
      case 'EMAIL':
        return <Mail size={20} color={theme.colors.secondary} />;
      case 'MEETING':
        return <Calendar size={20} color={theme.colors.warning} />;
      case 'NOTE':
        return <FileText size={20} color={theme.colors.info} />;
      case 'TASK':
        return <CheckSquare size={20} color={theme.colors.success} />;
      default:
        return <ActivityIcon size={20} color={theme.colors.textSecondary} />;
    }
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <Card style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
          {getActivityIcon(item.type)}
        </View>
        <View style={styles.activityInfo}>
          <Text style={[styles.activityType, { color: theme.colors.text }]}>
            {item.type}
          </Text>
          <Text style={[styles.activityDescription, { color: theme.colors.textSecondary }]}>
            {item.description}
          </Text>
          <Text style={[styles.activityDate, { color: theme.colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Activities</Text>
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No activities found"
            description="Your recent activities will appear here"
            icon={<ActivityIcon size={48} color={theme.colors.textSecondary} />}
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
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  activityCard: {
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
  },
});

