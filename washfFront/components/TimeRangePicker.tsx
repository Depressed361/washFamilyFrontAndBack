// src/components/TimeRangePicker.tsx
import { format } from 'date-fns'
import React, { useState } from 'react'
import { Button, Platform, StyleSheet, View } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'

export interface TimeRangePickerProps {
  isVisible: boolean
  onConfirm: (start: string, end: string) => void
  onCancel: () => void
}

export default function TimeRangePicker({
  isVisible,
  onConfirm,
  onCancel,
}: TimeRangePickerProps) {
  const [mode, setMode] = useState<'start' | 'end'>('start')
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600_000))

  const showPicker = (which: 'start' | 'end') => {
    setMode(which)
  }

  const handleConfirmNative = (date: Date) => {
     if (mode === 'start') {
    setStartDate(date)
  } else {
    setEndDate(date)
  }
  }

  const handleDone = () => {
    const fmt = (d: Date) => format(d, 'HH:mm')
    onConfirm(fmt(startDate), fmt(endDate))
  }

  return (
    <View style={styles.container}>
      <Button title={`Début : ${format(startDate, 'HH:mm')}`} onPress={() => showPicker('start')} />
      <Button title={`Fin   : ${format(endDate,   'HH:mm')}`} onPress={() => showPicker('end')} />

      <DateTimePickerModal
        isVisible={isVisible}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        is24Hour
        date={mode === 'start' ? startDate : endDate}
        onConfirm={handleConfirmNative}
        onCancel={onCancel}
      />

      <View style={styles.actions}>
        <Button title="Annuler" onPress={onCancel} />
        <Button title="Valider"  onPress={handleDone} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  actions:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
})
