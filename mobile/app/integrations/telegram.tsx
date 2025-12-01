import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { telegramService } from '@services/telegramService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, CheckCircle, XCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

export default function TelegramIntegrationScreen() {
  const { theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');

  const { data: status, refetch } = useQuery({
    queryKey: ['telegram-status'],
    queryFn: () => telegramService.getTelegramStatus(),
  });

  const connectMutation = useMutation({
    mutationFn: (phone: string) => telegramService.connectTelegram(phone),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Telegram Connected',
        text2: 'Successfully connected your Telegram account',
      });
      setPhoneNumber('');
      refetch();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Connection Failed',
        text2: 'Failed to connect Telegram account',
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => telegramService.disconnectTelegram(),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Telegram Disconnected',
        text2: 'Successfully disconnected your Telegram account',
      });
      refetch();
    },
  });

  const handleConnect = () => {
    if (!phoneNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone',
        text2: 'Please enter a valid phone number',
      });
      return;
    }
    connectMutation.mutate(phoneNumber);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Telegram Bot Integration
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Connect your Telegram account to receive notifications
          </Text>
        </View>

        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MessageSquare size={32} color={theme.colors.primary} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                Connection Status
              </Text>
              <View style={styles.statusBadge}>
                {status?.connected ? (
                  <>
                    <CheckCircle size={16} color={theme.colors.success} />
                    <Text style={[styles.statusText, { color: theme.colors.success }]}>
                      Connected
                    </Text>
                  </>
                ) : (
                  <>
                    <XCircle size={16} color={theme.colors.error} />
                    <Text style={[styles.statusText, { color: theme.colors.error }]}>
                      Not Connected
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {status?.connected && (
            <>
              {status?.phoneNumber && (
                <Text style={[styles.connectedInfo, { color: theme.colors.textSecondary }]}>
                  Phone: {status.phoneNumber}
                </Text>
              )}
              {status?.username && (
                <Text style={[styles.connectedInfo, { color: theme.colors.textSecondary }]}>
                  Username: @{status.username}
                </Text>
              )}
            </>
          )}
        </Card>

        <Card style={styles.featuresCard}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
            Features
          </Text>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Receive real-time notifications
            </Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Get updates on leads and tasks
            </Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Instant alerts for important events
            </Text>
          </View>
        </Card>

        {!status?.connected ? (
          <>
            <Input
              label="Phone Number"
              placeholder="+1234567890"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <Button
              title="Connect Telegram"
              onPress={handleConnect}
              loading={connectMutation.isPending}
            />
          </>
        ) : (
          <Button
            title="Disconnect Telegram"
            onPress={() => disconnectMutation.mutate()}
            variant="danger"
            loading={disconnectMutation.isPending}
          />
        )}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  connectedInfo: {
    fontSize: 14,
    marginTop: 8,
  },
  featuresCard: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 12,
  },
});

