import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/Card';
import { companyService } from '@services/companyService';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building, Check } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { CompanyUser } from '../types';

export default function WorkspaceScreen() {
  const { theme } = useTheme();
  const { activeCompanyId, activeRole, switchCompany } = useAuth();
  const router = useRouter();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getMyCompanies(),
  });

  const handleSwitchCompany = async (companyId: string, role: string) => {
    try {
      await switchCompany(companyId, role);
      Toast.show({
        type: 'success',
        text1: 'Workspace Switched',
        text2: 'Successfully switched workspace',
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Switch Failed',
        text2: 'Failed to switch workspace',
      });
    }
  };

  const renderCompany = ({ item }: { item: CompanyUser }) => {
    const isActive = item.companyId === activeCompanyId && item.role === activeRole;

    return (
      <Card
        style={[
          styles.companyCard,
          isActive && { borderColor: theme.colors.primary, borderWidth: 2 },
        ]}
        onPress={() => handleSwitchCompany(item.companyId, item.role)}
      >
        <View style={styles.companyHeader}>
          <View style={[styles.companyIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Building size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.companyInfo}>
            <Text style={[styles.companyName, { color: theme.colors.text }]}>
              {item.company.name}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.roleText, { color: theme.colors.primary }]}>
                {item.role}
              </Text>
            </View>
          </View>
          {isActive && <Check size={24} color={theme.colors.primary} />}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Switch Workspace
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Select a workspace to switch to
        </Text>
      </View>

      <FlatList
        data={companies}
        renderItem={renderCompany}
        keyExtractor={(item) => `${item.companyId}-${item.role}`}
        contentContainerStyle={styles.listContent}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  companyCard: {
    marginBottom: 12,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

