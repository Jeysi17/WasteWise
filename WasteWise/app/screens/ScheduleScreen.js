import React, { memo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList } from 'react-native';
import Header from '../../components/Home/header';
import colors from '../../constant/colors';
import { Calendar } from 'react-native-calendars';
import { SelectList } from 'react-native-dropdown-select-list';

const barangayEvents = {
  'Cabuco': {
    markedDates: {
      '2025-06-03': { marked: true, dotColor: colors.lime_green, selected: true, selectedColor: colors.lime_green },
      '2025-05-20': { marked: true, dotColor: colors.lime_green, selected: true, selectedColor: colors.lime_green },
      '2025-05-25': { marked: true, dotColor: colors.lime_green, selected: true, selectedColor: colors.lime_green }
    },
    events: [
      { id: '1', date: 'May 5, 2025', title: 'Community Clean-up', description: 'Annual barangay clean-up day' },
      { id: '2', date: 'May 20, 2025', title: 'Health Seminar', description: 'Free health seminar for residents' },
      { id: '3', date: 'May 25, 2025', title: 'Barangay Assembly', description: 'Monthly barangay meeting' }
    ]
  },
  'Osorio': {
    markedDates: {
      '2025-05-08': { marked: true, dotColor: colors.lime_green, selected: true, selectedColor: colors.lime_green },
      '2025-05-15': { marked: true, dotColor: colors.lime_green, selected: true, selectedColor: colors.lime_green },
      '2025-05-28': { marked: true, dotColor: colors.lime_green, selected: true, selectedColor: colors.lime_green }
    },
    events: [
      { id: '1', date: 'May 8, 2025', title: 'Health Check-up', description: 'Free medical check-up for seniors' },
      { id: '2', date: 'May 15, 2025', title: 'Zumba Session', description: 'Community fitness activity' },
      { id: '3', date: 'May 28, 2025', title: 'Council Meeting', description: 'Barangay council meeting' }
    ]
  },
  'San Agustin': {
    markedDates: {
      '2025-05-10': { marked: true, dotColor: colors.lime_green, selected: true, selectedColor: colors.lime_green },
      '2025-05-17': { marked: true, dotColor: colors.lime_green, selected: true, selectedColor: colors.lime_green },
      '2025-05-30': { marked: true, dotColor: colors.lime_green, selected: true, selectedColor: colors.lime_green }
    },
    events: [
      { id: '1', date: 'May 10, 2025', title: 'Livelihood Seminar', description: 'Skills training workshop' },
      { id: '2', date: 'May 17, 2025', title: 'Sports Festival', description: 'Annual barangay sports event' },
      { id: '3', date: 'May 30, 2025', title: 'Family Day', description: 'Community bonding activity' }
    ]
  }
};

const ScheduleScreen = ({ navigation }) => {
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const categories = [
    { key: '1', value: 'Cabuco' },
    { key: '2', value: 'Osorio' },
    { key: '3', value: 'San Agustin' },
  ];

  const renderEventItem = ({ item }) => (
    <View style={styles.eventItem}>
      <Text style={styles.eventDate}>{item.date}</Text>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{backgroundColor: colors.lime_green}}>
        <Text style={{
          fontFamily: 'PSemi-Bold',
          fontSize: 20,
          marginTop: 10,
          textAlign: 'center'
        }}>Waste Collection Schedule</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <SafeAreaView style={styles.container}>
          <SelectList
            setSelected={(val) => setSelectedBarangay(val)}
            data={categories}
            defaultOption={{ key: '0', value: 'Select Barangay' }}
            boxStyles={styles.selectBox}
            search={false}
            dropdownStyles={styles.dropdownBox}
            inputStyles={styles.inputText}
            dropdownTextStyles={styles.inputText}
            dropdownPosition="top"
            save="value"
          />
          {selectedBarangay && selectedBarangay !== 'Select Barangay' && (
            <>
              <View style={styles.calendarContainer}>
                <Calendar
                  style={styles.calendar}
                  markedDates={barangayEvents[selectedBarangay]?.markedDates || {}}
                  theme={{
                    selectedDayBackgroundColor: colors.lime_green,
                    todayTextColor: colors.lime_green,
                    arrowColor: colors.lime_green,
                  }}
                />
              </View>
              
             
            </>
          )}
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
  },
  contentContainer: {
    backgroundColor: colors.lime_green,
    flex: 1,
    paddingBottom: 10,
    
  },
  selectBox: {
    marginTop: 5, 
    backgroundColor: colors.BG_color, 
    margin: 5
  },
  dropdownBox: {
    backgroundColor: colors.BG_color,
    position: 'absolute',
    top: 50, 
    width: '95%',
    zIndex: 1000,
    alignSelf: 'center'
  },
  inputText: {
    fontSize: 13,
    fontFamily: 'PSemi-Bold',
  },
  calendarContainer: {
    backgroundColor: colors.BG_color,
    margin: 10,
    borderRadius: 10,
    elevation: 4,
    paddingBottom: 10
  },
  calendar: {
    borderRadius: 10,
    
  },
  eventsContainer: {
    flex: 1,
    backgroundColor: colors.BG_color,
    marginHorizontal: 10,
    borderRadius: 10,
    elevation: 4,
    padding: 10,
    
  },
  eventsTitle: {
    fontFamily: 'PSemi-Bold',
    fontSize: 18,
    marginVertical: 10,
    color: "#000000",
    textAlign: 'center'
  },
  eventItem: {
    backgroundColor: colors.light_gray,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 5
  },
  eventDate: {
    fontFamily: 'PSemi-Bold',
    color: colors.lime_green,
    fontSize: 12
  },
  eventTitle: {
    fontFamily: 'PSemi-Bold',
    fontSize: 16,
    marginTop: 5
  },
  eventDescription: {
    fontFamily: 'PRegular',
    fontSize: 14,
    marginTop: 5,
    color: '#000000'
  }
});

export default ScheduleScreen;