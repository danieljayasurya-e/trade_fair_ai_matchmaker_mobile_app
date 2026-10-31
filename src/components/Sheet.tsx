import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, radius, spacing, TOUCH, useTheme } from '../theme/theme';
import { CloseIcon } from './icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Heading, and the fallback name for the close button. */
  title: string;
  /** Replaces the plain title, for example with an icon or a stall's details. */
  heading?: ReactNode;
  /** Sits between the heading and the close button. */
  headerAction?: ReactNode;
  closeLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Shrink to the content instead of the full-height panel. */
  fit?: boolean;
}

/**
 * Bottom sheet built on the native Modal. `onRequestClose` makes the Android
 * back button close the sheet before it navigates anywhere.
 */
export function Sheet({ visible, onClose, title, heading, headerAction, closeLabel, children, footer, fit }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            fit ? styles.panelFit : styles.panelFull,
            styles.panel,
            { backgroundColor: colors.surface, paddingBottom: footer ? insets.bottom : insets.bottom + spacing.md },
          ]}
          accessibilityViewIsModal
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            {heading ?? (
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2} accessibilityRole="header">
                {title}
              </Text>
            )}
            {headerAction}
            <Pressable
              onPress={onClose}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel={closeLabel ?? 'Close sheet'}
            >
              <CloseIcon color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView style={fit ? undefined : styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  flex: { flex: 1 },
  panel: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden' },
  panelFull: { height: '88%' },
  panelFit: { maxHeight: '88%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: font.section, fontWeight: '600', lineHeight: 25 },
  close: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, borderTopWidth: 1 },
});
