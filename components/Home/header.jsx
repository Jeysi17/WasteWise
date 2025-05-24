import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import colors from '../../constant/colors'
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Header({ onMenuPress }) {
  return (
    <View style={{
        backgroundColor: colors.BG_color,
        padding: 10,
        borderBottomWidth: 5,
        borderBottomColor: colors.border_green,
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
        <TouchableOpacity style={styles.list} onPress={onMenuPress}>
            <Ionicons name="list" size={24} color={colors.lime_green} />
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    alignSelf: 'flex-end',
    position: 'absolute',
    marginTop: '5%',
    marginRight: '3%',
    paddingLeft: 4,
    paddingRight: 4,
    paddingBottom: 3,
    paddingTop: 3, 
    borderWidth: 2,
    borderRadius: 10,
    borderColor: colors.border_green,
  }
})
