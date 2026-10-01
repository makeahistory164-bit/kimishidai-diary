import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useTodos } from '@/hooks/useTodos';
import { DoneForSheet } from '@/components/DoneForSheet';
import { MascotSpeech } from '@/components/MascotSpeech';
import type { MascotExpression } from '@/components/Mascot';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { TODO_DONE_FOR_OPTIONS, type Todo, type TodoDoneFor } from '@/types/models';
import { TYPE, SPACING, RADIUS, MIN_TAP, SCREEN_PADDING } from '@/constants/theme';
import { SectionHeader } from '@/components/ui/SectionHeader';

/**
 * キャラのセリフ。★未完了の件数には絶対に触れないこと。
 *
 * 「あと3つ」「がんばって終わらせよう」の類は、この画面の設計方針
 * （TODOの達成状況で人を評価しない・要らないと判断してやめた日こそ自分軸）と
 * 要件書8.4「責めない語り口」の両方に反する。
 * 表情も達成率では変えない（達成率で沈む顔を出した時点で、それは採点である）。
 */
function todoSpeech(
  total: number,
  doneCount: number
): { expression: MascotExpression; title: string; body: string } {
  if (total === 0) {
    return {
      expression: 'cheer',
      title: '今日やろうと思っていること、書いてみる？',
      body: '終わらなくても点数は下がりません。',
    };
  }
  if (doneCount === 0) {
    return {
      expression: 'think',
      title: 'どれから手をつける？',
      body: '「やらない」と決めるのも、自分で選んだひとつ。',
    };
  }
  return {
    expression: 'joy',
    title: 'おつかれさま。',
    body: 'やり終えたことは、下でふりかえれます。',
  };
}

/**
 * 今日のTODO画面。
 *
 * 【設計方針】TODOの達成状況は軸スコアに一切影響しない。
 * 未達成でも「自分軸で過ごせていない」とは表示しない ——
 * 頼まれ仕事を全部こなした日が満点になり、要らないと判断してやめた日が減点になる、
 * という判定の逆転が起きるため（要件書10.6がスクリーンタイムで出したのと同じ結論）。
 * ここで集めた「誰のためにやったか」は、ユーザー自身の振り返り材料として表示し、
 * 将来のAI質問生成の入力にもする。
 */
export default function TodoScreen() {
  const { todos, loading, completedCount, total, add, complete, uncomplete, changeDoneFor, remove } =
    useTodos();
  const [draft, setDraft] = useState('');
  const [sheetTarget, setSheetTarget] = useState<Todo | null>(null);
  const [sheetMode, setSheetMode] = useState<'complete' | 'change'>('complete');

  const openCompleteSheet = (todo: Todo) => {
    setSheetMode('complete');
    setSheetTarget(todo);
  };

  const openChangeSheet = (todo: Todo) => {
    setSheetMode('change');
    setSheetTarget(todo);
  };

  const handleSelectDoneFor = async (doneFor: TodoDoneFor) => {
    if (!sheetTarget) return;
    if (sheetMode === 'complete') {
      await complete(sheetTarget.id, doneFor);
    } else {
      await changeDoneFor(sheetTarget.id, doneFor);
    }
    setSheetTarget(null);
  };

  const handleAdd = async () => {
    await add(draft);
    setDraft('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={NEUTRAL_COLORS.accent} />
      </SafeAreaView>
    );
  }

  const pending = todos.filter((t) => t.completedAt === null);
  const done = todos.filter((t) => t.completedAt !== null);
  const speech = todoSpeech(total, done.length);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {total > 0 && (
          <Text style={styles.progress}>
            {completedCount} / {total} 完了
          </Text>
        )}

        <View style={styles.speechBlock}>
          <MascotSpeech
            expression={speech.expression}
            surfaceColor={NEUTRAL_COLORS.background}
            bubbleColor={NEUTRAL_COLORS.surface}
            size={56}
          >
            <Text style={styles.speechTitle}>{speech.title}</Text>
            <Text style={styles.speechBody}>{speech.body}</Text>
          </MascotSpeech>
        </View>

        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="やることを追加"
            placeholderTextColor={NEUTRAL_COLORS.textSecondary}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>追加</Text>
          </Pressable>
        </View>

        {pending.map((todo) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            onToggle={() => openCompleteSheet(todo)}
            onChangeDoneFor={() => openChangeSheet(todo)}
            onDelete={() => remove(todo.id)}
          />
        ))}

        {done.length > 0 && (
          <>
            <SectionHeader title="完了したこと" />
            {done.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                onToggle={() => uncomplete(todo.id)}
                onChangeDoneFor={() => openChangeSheet(todo)}
                onDelete={() => remove(todo.id)}
              />
            ))}
            <DoneForBreakdown todos={done} />
          </>
        )}
      </ScrollView>

      <DoneForSheet
        visible={sheetTarget !== null}
        todoText={sheetTarget?.text ?? ''}
        current={sheetMode === 'change' ? sheetTarget?.doneFor : null}
        onSelect={handleSelectDoneFor}
        onCancel={() => setSheetTarget(null)}
      />
    </SafeAreaView>
  );
}

function TodoRow({
  todo,
  onToggle,
  onChangeDoneFor,
  onDelete,
}: {
  todo: Todo;
  onToggle: () => void;
  onChangeDoneFor: () => void;
  onDelete: () => void;
}) {
  const isDone = todo.completedAt !== null;
  const option = TODO_DONE_FOR_OPTIONS.find((o) => o.value === todo.doneFor);

  return (
    <View style={styles.todoRow}>
      {/* 以前は ☐/☑︎ という文字で状態を描いていたため、VoiceOverが記号名を読み、
          チェックボックスであることも状態も伝わらなかった */}
      <Pressable
        onPress={onToggle}
        style={styles.checkbox}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone }}
        accessibilityLabel={todo.text}
      >
        <SymbolView
          name={isDone ? 'checkmark.circle.fill' : 'circle'}
          size={24}
          tintColor={isDone ? NEUTRAL_COLORS.accent : NEUTRAL_COLORS.textSecondary}
          resizeMode="scaleAspectFit"
        />
      </Pressable>

      <View style={styles.todoBody}>
        <Text style={[styles.todoText, isDone && styles.todoTextDone]}>{todo.text}</Text>
        {isDone && option && (
          <Pressable
            onPress={onChangeDoneFor}
            style={styles.doneForButton}
            accessibilityRole="button"
            accessibilityLabel={`誰のためか: ${option.label}`}
            accessibilityHint="タップして変更します"
          >
            <Text style={styles.doneForTag}>
              {option.emoji} {option.label}
            </Text>
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={onDelete}
        style={styles.deleteButton}
        accessibilityRole="button"
        accessibilityLabel={`${todo.text} を削除`}
      >
        <SymbolView
          name="xmark"
          size={15}
          tintColor={NEUTRAL_COLORS.textSecondary}
          resizeMode="scaleAspectFit"
        />
      </Pressable>
    </View>
  );
}

/** 完了したTODOの「誰のため」内訳。評価はせず、事実だけを見せる */
function DoneForBreakdown({ todos }: { todos: Todo[] }) {
  const counts = TODO_DONE_FOR_OPTIONS.map((option) => ({
    ...option,
    count: todos.filter((t) => t.doneFor === option.value).length,
  })).filter((c) => c.count > 0);

  if (counts.length === 0) return null;

  return (
    <View style={styles.breakdown}>
      <Text style={styles.breakdownTitle}>今日やり終えたことの内訳</Text>
      {counts.map((c) => (
        <View key={c.value} style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>
            {c.emoji} {c.label}
          </Text>
          <Text style={styles.breakdownCount}>{c.count}件</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SCREEN_PADDING, paddingBottom: SPACING.xxl * 2, gap: SPACING.md },
  progress: { ...TYPE.footnote, color: NEUTRAL_COLORS.textSecondary },
  addRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  addInput: {
    flex: 1,
    minHeight: MIN_TAP,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    borderRadius: RADIUS.control,
    paddingHorizontal: SPACING.md,
    ...TYPE.body,
    color: NEUTRAL_COLORS.textPrimary,
    backgroundColor: NEUTRAL_COLORS.surface,
  },
  addButton: {
    minHeight: MIN_TAP,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    borderRadius: RADIUS.control,
    backgroundColor: NEUTRAL_COLORS.accent,
  },
  addButtonText: { ...TYPE.headline, color: NEUTRAL_COLORS.onAccent },
  speechBlock: { marginTop: SPACING.sm },
  speechTitle: { ...TYPE.headline, color: NEUTRAL_COLORS.textPrimary },
  speechBody: { ...TYPE.subhead, color: NEUTRAL_COLORS.textSecondary },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: NEUTRAL_COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  // 見た目は記号だけだが、HIGの最小タップ寸法44ptを満たす
  checkbox: {
    width: MIN_TAP,
    height: MIN_TAP,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -SPACING.xs,
  },
  todoBody: { flex: 1, paddingVertical: SPACING.sm },
  todoText: { ...TYPE.body, color: NEUTRAL_COLORS.textPrimary },
  todoTextDone: { color: NEUTRAL_COLORS.textSecondary, textDecorationLine: 'line-through' },
  doneForButton: { minHeight: MIN_TAP, justifyContent: 'center' },
  doneForTag: { ...TYPE.footnote, color: NEUTRAL_COLORS.textSecondary },
  deleteButton: {
    width: MIN_TAP,
    height: MIN_TAP,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -SPACING.xs,
  },
  breakdown: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.card,
    backgroundColor: NEUTRAL_COLORS.surface,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
    gap: SPACING.sm,
  },
  breakdownTitle: { ...TYPE.headline, color: NEUTRAL_COLORS.textPrimary },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { ...TYPE.subhead, color: NEUTRAL_COLORS.textPrimary },
  breakdownCount: { ...TYPE.subhead, color: NEUTRAL_COLORS.textSecondary },
});
