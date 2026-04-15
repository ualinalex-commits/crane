import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function SubcontractorsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Subcontractors</Text>
      <Pressable
        onPress={() => router.push('/(tabs)/(management)/subcontractors/new')}
        style={{ backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>+ Add Subcontractor</Text>
      </Pressable>
    </View>
  );
}
