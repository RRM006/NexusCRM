import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { companyService } from '@services/companyService';
import { useQuery } from '@tanstack/react-query';
import { Users, UserPlus, CheckSquare, AlertCircle, TrendingUp, Settings } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { user, activeCompanyId, activeRole, logout } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: companies, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getMyCompanies(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const stats = [
    { icon: Users, label: 'Customers', value: '0', color: theme.colors.primary },
    { icon: UserPlus, label: 'Leads', value: '0', color: theme.colors.secondary },
    { icon: CheckSquare, label: 'Tasks', value: '0', color: theme.colors.info },
    { icon: AlertCircle, label: 'Issues', value: '0', color: theme.colors.error },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user?.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/profile' as any)}
            style={[styles.settingsButton, { backgroundColor: theme.colors.surface }]}
          >
            <Settings size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Role Badge */}
        <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.roleText}>{activeRole}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <stat.icon size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {stat.label}
              </Text>
            </Card>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Quick Actions
          </Text>
          <Card>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/crm/leads/create' as any)}
            >
              <UserPlus size={20} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Add New Lead
              </Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/tasks/create' as any)}
            >
              <CheckSquare size={20} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Create Task
              </Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/workspace' as any)}
            >
              <TrendingUp size={20} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                Switch Workspace
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Activity
          </Text>
          <Card>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No recent activity
            </Text>
          </Card>
        </View>

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={logout}
          variant="outline"
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    margin: '1.5%',
    alignItems: 'center',
    padding: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  divider: {
    height: 1,
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
  },
  logoutButton: {
    marginBottom: 24,
  },
});

