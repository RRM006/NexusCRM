import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { useCall } from '@context/CallContext';
import { useAuth } from '@context/AuthContext';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, PhoneOff, Mic, MicOff, User } from 'lucide-react-native';

export default function CallsScreen() {
  const { theme } = useTheme();
  const { activeRole } = useAuth();
  const {
    isInCall,
    isCalling,
    isReceivingCall,
    callerName,
    receiverName,
    isMuted,
    callDuration,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  } = useCall();

  const [showContactList, setShowContactList] = useState(false);

  // Mock contacts - in real app, fetch from API
  const contacts = [
    { id: '1', name: 'Admin User', role: 'ADMIN' },
    { id: '2', name: 'Support Team', role: 'STAFF' },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = (contactId: string, contactName: string) => {
    startCall(contactId, contactName);
    setShowContactList(false);
  };

  // Incoming Call Modal
  if (isReceivingCall) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.callScreen}>
          <View style={styles.callerInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <User size={48} color="#ffffff" />
            </View>
            <Text style={[styles.callerName, { color: theme.colors.text }]}>
              {callerName}
            </Text>
            <Text style={[styles.callStatus, { color: theme.colors.textSecondary }]}>
              Incoming call...
            </Text>
          </View>

          <View style={styles.callActions}>
            <TouchableOpacity
              onPress={rejectCall}
              style={[styles.callButton, { backgroundColor: theme.colors.error }]}
            >
              <PhoneOff size={32} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={acceptCall}
              style={[styles.callButton, { backgroundColor: theme.colors.success }]}
            >
              <Phone size={32} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Active Call Screen
  if (isInCall || isCalling) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.callScreen}>
          <View style={styles.callerInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <User size={48} color="#ffffff" />
            </View>
            <Text style={[styles.callerName, { color: theme.colors.text }]}>
              {receiverName || callerName}
            </Text>
            <Text style={[styles.callStatus, { color: theme.colors.textSecondary }]}>
              {isCalling ? 'Calling...' : formatDuration(callDuration)}
            </Text>
          </View>

          <View style={styles.callActions}>
            <TouchableOpacity
              onPress={toggleMute}
              style={[
                styles.callButton,
                { backgroundColor: isMuted ? theme.colors.error : theme.colors.surface },
              ]}
            >
              {isMuted ? (
                <MicOff size={32} color="#ffffff" />
              ) : (
                <Mic size={32} color={theme.colors.text} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={endCall}
              style={[styles.callButton, { backgroundColor: theme.colors.error }]}
            >
              <PhoneOff size={32} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Default Screen - Call History & Start Call
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Calls</Text>
      </View>

      <View style={styles.content}>
        {activeRole === 'CUSTOMER' && (
          <Card style={styles.callCard}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Need Help?
            </Text>
            <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              Call our support team for assistance
            </Text>
            <Button
              title="Call Support"
              onPress={() => setShowContactList(true)}
              style={styles.callButton}
            />
          </Card>
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Call History
        </Text>
        <Card>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No call history yet
          </Text>
        </Card>
      </View>

      {/* Contact List Modal */}
      <Modal
        visible={showContactList}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContactList(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Contact
            </Text>
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => handleStartCall(item.id, item.name)}
                >
                  <View style={[styles.contactAvatar, { backgroundColor: theme.colors.primary }]}>
                    <User size={24} color="#ffffff" />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: theme.colors.text }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.contactRole, { color: theme.colors.textSecondary }]}>
                      {item.role}
                    </Text>
                  </View>
                  <Phone size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            />
            <Button
              title="Cancel"
              onPress={() => setShowContactList(false)}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    padding: 16,
  },
  callCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
  },
  callScreen: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 32,
  },
  callerInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 18,
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 32,
  },
  callButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactRole: {
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 16,
  },
});

