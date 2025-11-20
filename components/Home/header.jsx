import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../../constant/colors';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Header({ onMenuPress }) {
  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>WasteWise</Text>
      {/* Menu Button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          console.log("✅ Menu button pressed");
          if (onMenuPress) onMenuPress();
        }}
      >
        <Ionicons name="list" size={28} color={colors.lime_green} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.BG_color,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 5,
    borderBottomColor: colors.border_green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 25,
    fontFamily: 'PSemi-Bold',
    color: colors.border_green,

  },
  menuButton: {
    position: 'absolute', // 👈 stays on top
    right: 15,
    top: '50%',
    transform: [{ translateY: -14 }], // vertically center relative to icon size
    padding: 6,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: colors.border_green,
  },
});
