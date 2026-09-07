import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NEUTRAL_COLORS } from '@/constants/colors';
import type { LegalDocument } from '@/constants/legalDocuments';

interface Props {
  document: LegalDocument;
}

export function LegalDocumentScreen({ document }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{document.title}</Text>
          <Text style={styles.updated}>最終更新日: {document.lastUpdated}</Text>
          <Text style={styles.intro}>{document.intro}</Text>
        </View>

        {document.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body.map((paragraph) => (
              <Text key={paragraph} style={styles.body}>
                {paragraph}
              </Text>
            ))}
            {section.bullets && (
              <View style={styles.bulletList}>
                {section.bullets.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <Text style={styles.bulletMark}>・</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  content: { padding: 20, paddingBottom: 48, gap: 20 },
  header: {
    backgroundColor: NEUTRAL_COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    padding: 18,
    gap: 8,
  },
  title: { fontSize: 24, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  updated: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary },
  intro: { fontSize: 14, lineHeight: 22, color: NEUTRAL_COLORS.textPrimary },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  body: { fontSize: 14, lineHeight: 23, color: NEUTRAL_COLORS.textPrimary },
  bulletList: { gap: 6, marginTop: 2 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  bulletMark: { fontSize: 14, lineHeight: 22, color: NEUTRAL_COLORS.textPrimary },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22, color: NEUTRAL_COLORS.textPrimary },
});
