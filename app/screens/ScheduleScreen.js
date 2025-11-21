import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constant/colors';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ScheduleScreen = () => {
  const { userLocation } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (userLocation) {
      GetSchedules();
      const interval = setInterval(() => GetSchedules(), 3000);
      return () => clearInterval(interval);
    }
  }, [userLocation]);

  // ✅ Parse different date formats safely
  const parseServerDate = (dateString) => {
    if (!dateString) return null;

    // e.g. "2025-11-07"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    // e.g. "2025-11-07T00:00:00.000Z"
    if (dateString.includes('T')) {
      const date = new Date(dateString);
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    }

    // e.g. "11/07/2025"
    if (dateString.includes('/')) {
      const [month, day, year] = dateString.split('/');
      return new Date(year, month - 1, day);
    }

    return null;
  };

  const formatCalendarDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const GetSchedules = async () => {
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_HOST_URL + '/api/schedules');
      const data = await response.json();
      console.log('🧾 Raw Schedules:', data); // Debug log
  
      // ✅ Filter schedules by user's barangay and only pending ones
      const pendingSchedules = data.filter(
        (item) =>
          item.barangay?.toLowerCase().trim() === userLocation?.toLowerCase().trim() &&
          item.completed === false // Only pending schedules
      );
  
      setSchedules(pendingSchedules);
  
      // ✅ Mark calendar dates
      const dates = {};
      pendingSchedules.forEach((item) => {
        const date = parseServerDate(item.schedule_date);
        if (!date) return;
  
        const dateStr = formatCalendarDate(date);
        dates[dateStr] = {
          marked: true,
          dotColor: colors.lime_green,
          selected: true,
          selectedColor: colors.lime_green,
        };
      });
  
      setMarkedDates(dates);
      console.log('📅 Marked Dates:', dates);
    } catch (err) {
      console.error('❌ Error fetching schedules:', err);
    }
  };
  
  

  const getFilteredSchedules = () => {
    if (!userLocation) return [];
  
    return schedules
      .filter(
        (item) =>
          item.barangay?.toLowerCase().trim() === userLocation?.toLowerCase().trim() &&
          item.completed === false // Only pending
      )
      .map((item) => {
        const date = parseServerDate(item.schedule_date);
        if (!date) return null;
  
        return {
          id: item.id,
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          title: 'Waste Collection',
          description: `${item.waste_type || 'Waste'} collection scheduled`,
        };
      })
      .filter((item) => item !== null);
  };
  

  const renderEventItem = ({ item }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventDate}>{item.date}</Text>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: colors.lime_green }}>
        <Text
          style={{
            fontSize: SCREEN_WIDTH * 0.06, 
                textAlign: 'center', 
                marginTop: SCREEN_HEIGHT * 0.025,  
                fontFamily: 'PSemi-Bold',
                color: colors.border_green,
                width: SCREEN_WIDTH * 0.8,
                alignSelf: 'center',
                backgroundColor: colors.pale_green,
                borderRadius: 20,
                paddingTop: SCREEN_HEIGHT * 0.0069,
                borderWidth: 2,
                borderColor: colors.border_green,
          }}
        >
          Waste Collection Schedule for {userLocation}
        </Text>
      </View>

      <View style={styles.contentContainer}>
        <SafeAreaView style={styles.container}>

          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: colors.lime_green,
                todayTextColor: colors.lime_green,
                arrowColor: colors.lime_green,
              }}
            />
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  subtitle: {
    fontFamily: 'PSemi-Bold',
    textAlign: 'center',
    fontSize: SCREEN_WIDTH * 0.04,
    marginTop: SCREEN_HEIGHT * 0.012,
  },
  contentContainer: {
    backgroundColor: colors.lime_green,
    flex: 1,
    paddingBottom: SCREEN_HEIGHT * 0.012,
  },
  calendarContainer: {
    backgroundColor: colors.pale_green,
    margin: SCREEN_WIDTH * 0.025,
    borderRadius: 10,
    elevation: 4,
    paddingBottom: SCREEN_HEIGHT * 0.012,
    marginTop: SCREEN_HEIGHT * 0.012,
  },
  calendar: { borderRadius: 10 },
  viewScheduleButton: {
    backgroundColor: colors.BG_color,
    padding: SCREEN_WIDTH * 0.04,
    borderRadius: 10,
    marginHorizontal: SCREEN_WIDTH * 0.025,
    marginTop: SCREEN_HEIGHT * 0.012,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  viewScheduleButtonText: {
    fontFamily: 'PSemi-Bold',
    color: colors.white,
    fontSize: SCREEN_WIDTH * 0.04,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.BG_color,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SCREEN_WIDTH * 0.05,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.018,
  },
  modalTitle: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.05,
    color: colors.black,
  },
  closeButton: { padding: SCREEN_HEIGHT * 0.006 },
  modalListContent: { paddingBottom: SCREEN_HEIGHT * 0.025 },
  eventItem: {
    backgroundColor: colors.light_gray,
    padding: SCREEN_WIDTH * 0.04,
    borderRadius: 10,
    marginBottom: SCREEN_HEIGHT * 0.012,
    marginHorizontal: SCREEN_WIDTH * 0.012,
  },
  eventDate: {
    fontFamily: 'PSemi-Bold',
    color: colors.lime_green,
    fontSize: SCREEN_WIDTH * 0.03,
  },
  eventTitle: {
    fontFamily: 'PSemi-Bold',
    fontSize: SCREEN_WIDTH * 0.04,
    marginTop: SCREEN_HEIGHT * 0.006,
  },
  eventDescription: {
    fontFamily: 'PRegular',
    fontSize: SCREEN_WIDTH * 0.035,
    marginTop: SCREEN_HEIGHT * 0.006,
    color: colors.black,
  },
});

export default ScheduleScreen;
