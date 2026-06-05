import React from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

export interface PillOption {
  value: string;
  label: string;
}

interface Props {
  options: PillOption[];
  value: string;
  onChange: (v: string) => void;
}

export function CategoryPills({ options, value, onChange }: Props) {
  return (
    <FlatList
      data={options}
      keyExtractor={(item) => item.value}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const active = item.value === value;
        return (
          <TouchableOpacity
            onPress={() => onChange(item.value)}
            style={[styles.pill, active && styles.pillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontFamily: fonts.body.medium,
    fontSize: 13,
    color: colors.muted,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
