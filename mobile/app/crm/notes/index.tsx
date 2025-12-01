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
import { noteService } from '@services/noteService';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, FileText } from 'lucide-react-native';
import { Note } from '../../../types';

export default function NotesScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notes'],
    queryFn: () => noteService.getNotes({}),
  });

  const notes = data?.data || [];

  const renderNote = ({ item }: { item: Note }) => (
    <Card
      style={styles.noteCard}
      onPress={() => router.push(`/crm/notes/${item.id}` as any)}
    >
      <Text style={[styles.noteTitle, { color: theme.colors.text }]}>
        {item.title}
      </Text>
      <Text
        style={[styles.noteContent, { color: theme.colors.textSecondary }]}
        numberOfLines={3}
      >
        {item.content}
      </Text>
      <Text style={[styles.noteDate, { color: theme.colors.textSecondary }]}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Notes</Text>
        <TouchableOpacity
          onPress={() => router.push('/crm/notes/create' as any)}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No notes found"
            description="Create your first note"
            icon={<FileText size={48} color={theme.colors.textSecondary} />}
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
  listContent: {
    padding: 16,
  },
  noteCard: {
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
  },
});

