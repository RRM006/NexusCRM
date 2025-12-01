import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  Phone,
  Building,
  Moon,
  Sun,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { user, activeCompanyId, activeRole, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
        </View>

        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <User size={48} color="#ffffff" />
          </View>
          <Text style={[styles.userName, { color: theme.colors.text }]}>
            {user?.name}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
            {user?.email}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.roleText}>{activeRole}</Text>
          </View>
        </Card>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Account
        </Text>

        <Card>
          <TouchableOpacity style={styles.menuItem}>
            <Mail size={20} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              {user?.email}
            </Text>
          </TouchableOpacity>

          {user?.phone && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <TouchableOpacity style={styles.menuItem}>
                <Phone size={20} color={theme.colors.primary} />
                <Text style={[styles.menuText, { color: theme.colors.text }]}>
                  {user.phone}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/workspace' as any)}
          >
            <Building size={20} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              Switch Workspace
            </Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Appearance
        </Text>

        <Card>
          <View style={styles.menuItem}>
            {isDark ? (
              <Moon size={20} color={theme.colors.primary} />
            ) : (
              <Sun size={20} color={theme.colors.primary} />
            )}
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              Dark Mode
            </Text>
            <Switch
              value={isDark}
              onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        </Card>

        {/* Integrations Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Integrations
        </Text>

        <Card>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/integrations/gmail' as any)}
          >
            <Mail size={20} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              Gmail Integration
            </Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/integrations/telegram' as any)}
          >
            <Phone size={20} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.text }]}>
              Telegram Bot
            </Text>
            <ChevronRight size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </Card>

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  userCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  divider: {
    height: 1,
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 24,
  },
});

