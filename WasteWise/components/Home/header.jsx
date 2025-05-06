import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import colors from '../../constant/colors'
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Header() {
  return (
    <View style={{
        backgroundColor: colors.BG_color,
        padding: 10,
    }}>
        <View>
            <Text style={{
                alignSelf: 'center',
                fontSize: 25,
                fontFamily: 'PSemi-Bold',
                color: colors.lime_green,
                marginTop: 5
            }}>WasteWise</Text>
        </View>
        <TouchableOpacity style={styles.list}>
            <Ionicons name="list" size={24} color={colors.lime_green} />
        </TouchableOpacity>

    </View>
  )
}
const styles = StyleSheet.create({
  list: {
    alignSelf: 'flex-end',
    position: 'absolute',
    marginTop: 20,
    paddingEnd: 10
  }
})
