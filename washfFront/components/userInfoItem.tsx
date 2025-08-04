// components/UserInfoItem.tsx
import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

type Props = {
  label: string;
  value: string | number | null | undefined;
};

export default function UserInfoItem({ label, value }: Props) {
  if (!value) return null;

  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'purple',
    marginBottom: 4,
  },
  text: {
    fontSize: 16,
    color: 'black',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
});