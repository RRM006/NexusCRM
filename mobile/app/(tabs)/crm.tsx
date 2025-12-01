import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@context/ThemeContext';
import { useAuth } from '@context/AuthContext';
import { Card } from '@components/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  UserPlus,
  Contact,
  FileText,
  Activity,
  AlertCircle,
} from 'lucide-react-native';

export default function CRMScreen() {
  const { theme } = useTheme();
  const { activeRole } = useAuth();
  const router = useRouter();

  const modules = [
    {
      icon: Users,
      title: 'Customers',
      description: 'Manage customer database',
      route: '/crm/customers',
      color: theme.colors.primary,
      roles: ['ADMIN'],
    },
    {
      icon: UserPlus,
      title: 'Leads',
      description: 'Track and convert leads',
      route: '/crm/leads',
      color: theme.colors.secondary,
      roles: ['ADMIN', 'STAFF'],
    },
    {
      icon: Contact,
      title: 'Contacts',
      description: 'Contact information',
      route: '/crm/contacts',
      color: theme.colors.info,
      roles: ['ADMIN', 'STAFF'],
    },
    {
      icon: FileText,
      title: 'Notes',
      description: 'Keep track of notes',
      route: '/crm/notes',
      color: theme.colors.warning,
      roles: ['ADMIN', 'STAFF'],
    },
    {
      icon: Activity,
      title: 'Activities',
      description: 'View all activities',
      route: '/crm/activities',
      color: theme.colors.success,
      roles: ['ADMIN', 'STAFF'],
    },
    {
      icon: AlertCircle,
      title: 'Issues',
      description: 'Track customer issues',
      route: '/crm/issues',
      color: theme.colors.error,
      roles: ['ADMIN', 'CUSTOMER'],
    },
  ];

  const filteredModules = modules.filter((module) =>
    module.roles.includes(activeRole || '')
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>CRM Modules</Text>

        <View style={styles.grid}>
          {filteredModules.map((module, index) => (
            <Card
              key={index}
              style={styles.moduleCard}
              onPress={() => router.push(module.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: module.color + '20' }]}>
                <module.icon size={32} color={module.color} />
              </View>
              <Text style={[styles.moduleTitle, { color: theme.colors.text }]}>
                {module.title}
              </Text>
              <Text style={[styles.moduleDescription, { color: theme.colors.textSecondary }]}>
                {module.description}
              </Text>
            </Card>
          ))}
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  moduleCard: {
    width: '47%',
    margin: '1.5%',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  moduleDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
});

