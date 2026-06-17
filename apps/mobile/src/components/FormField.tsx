import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme/colors';

type Props = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'decimal-pad' | 'numeric' | 'email-address' | 'number-pad';
  multiline?: boolean;
};

export function FormField({
  label,
  value,
  placeholder,
  onChangeText,
  error,
  autoCapitalize,
  keyboardType,
  multiline,
}: Props) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, error && styles.inputError, multiline && styles.multilineInput]}
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 7 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  input: {
    minHeight: 44,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    color: colors.ink,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '800',
  },
  inputError: { borderColor: colors.red },
  errorText: { color: colors.red, fontSize: 12, fontWeight: '800', lineHeight: 16 },
  multilineInput: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' as const },
});
