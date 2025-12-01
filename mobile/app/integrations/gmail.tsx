import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { emailService } from '@services/emailService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, CheckCircle, XCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_CLIENT_ID } from '../../constants/config';

WebBrowser.maybeCompleteAuthSession();

export default function GmailIntegrationScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
  });

  const { data: status, refetch } = useQuery({
    queryKey: ['gmail-status'],
    queryFn: () => emailService.getGmailStatus(),
  });

  const connectMutation = useMutation({
    mutationFn: (authCode: string) => emailService.connectGmail(authCode),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Gmail Connected',
        text2: 'Successfully connected your Gmail account',
      });
      refetch();
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: 'Connection Failed',
        text2: 'Failed to connect Gmail account',
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => emailService.disconnectGmail(),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Gmail Disconnected',
        text2: 'Successfully disconnected your Gmail account',
      });
      refetch();
    },
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        connectMutation.mutate(authentication.accessToken);
      }
    }
  }, [response]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Gmail Integration
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Connect your Gmail account to send emails directly from the app
          </Text>
        </View>

        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Mail size={32} color={theme.colors.primary} />
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

          {status?.connected && status?.email && (
            <Text style={[styles.connectedEmail, { color: theme.colors.textSecondary }]}>
              Connected as: {status.email}
            </Text>
          )}
        </Card>

        <Card style={styles.featuresCard}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
            Features
          </Text>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Send emails directly from the app
            </Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Track email opens and clicks
            </Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Email history per contact
            </Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle size={20} color={theme.colors.success} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              Use email templates
            </Text>
          </View>
        </Card>

        {status?.connected ? (
          <Button
            title="Disconnect Gmail"
            onPress={() => disconnectMutation.mutate()}
            variant="danger"
            loading={disconnectMutation.isPending}
          />
        ) : (
          <Button
            title="Connect Gmail"
            onPress={() => promptAsync()}
            disabled={!request}
            loading={connectMutation.isPending}
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
  connectedEmail: {
    fontSize: 14,
    marginTop: 12,
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

