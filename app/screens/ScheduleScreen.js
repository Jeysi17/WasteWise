import React, { memo, useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, ScrollView, Modal, TouchableOpacity } from 'react-native';
import Header from '../../components/Home/header';
import colors from '../../constant/colors';
import { Calendar } from 'react-native-calendars';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';

const ScheduleScreen = ({ navigation }) => {
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState([
    {label: 'Aguado', value: 'Aguado'},
    {label: 'Cabezas', value: 'Cabezas'},
    {label: 'Cabuco', value: 'Cabuco'},
    {label: 'Conchu', value: 'Conchu'},
    {label: 'De Ocampo', value: 'De Ocampo'},
    {label: 'Gregorio', value: 'Gregorio'},
    {label: 'Hugo Perez', value: 'Hugo Perez'},
    {label: 'Inocencio', value: 'Inocencio'},
    {label: 'Lallana', value: 'Lallana'},
    {label: 'Lapidario', value: 'Lapidario'},
    {label: 'Luciano', value: 'Luciano'},
    {label: 'Osorio', value: 'Osorio'},
    {label: 'San Agustin', value: 'San Agustin'}
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      GetSchedules();
    }, 30000); 

    GetSchedules();
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedBarangay) {
      updateMarkedDates();
    } else {
      setMarkedDates({});
    }
  }, [selectedBarangay, schedules]);

  const GetSchedules = async () => {
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_HOST_URL+'/schedule');
      const data = await response.json();
      setSchedules(data);
    } catch(err) {
      console.error("Error fetching schedules", err);
    }
  }

  const parseServerDate = (dateString) => {
    if (!dateString) return null;
    
    // Handle both "M/D/YYYY" and ISO format cases
    if (dateString.includes('/')) {
      const [month, day, year] = dateString.split('/');
      return new Date(year, month - 1, day);
    } else if (dateString.includes('T')) {
      return new Date(dateString);
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

  const updateMarkedDates = () => {
    const dates = {};
    
    schedules
      .filter(item => item.barangay === selectedBarangay)
      .forEach(item => {
        const date = parseServerDate(item.schedule_date);
        if (!date) {
          console.warn("Invalid date:", item.schedule_date);
          return;
        }
        
        const dateStr = formatCalendarDate(date);
        if (!dateStr) {
          console.warn("Failed to format date:", date);
          return;
        }
        
        dates[dateStr] = { 
          marked: true,
          dotColor: colors.lime_green,
          selected: true,
          selectedColor: colors.lime_green
        };
      });
    
    setMarkedDates(dates);
  }

  const getFilteredSchedules = () => {
    if (!selectedBarangay) return [];
    
    return schedules
      .filter(item => item.barangay === selectedBarangay)
      .map(item => {
        const date = parseServerDate(item.schedule_date);
        if (!date) return null;
        
        return {
          id: item._id,
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          title: 'Waste Collection',
          description: `${item.waste_type || 'Waste'} collection scheduled`
        };
      })
      .filter(item => item !== null);
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
          <View style={styles.dropdownWrapper}>
            <DropDownPicker
              open={open}
              value={selectedBarangay}
              items={items}
              setOpen={setOpen}
              setValue={setSelectedBarangay}
              setItems={setItems}
              placeholder="Select Barangay"
              placeholderStyle={styles.placeholderStyle}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownList}
              labelStyle={styles.labelStyle}
              listItemLabelStyle={styles.listItemLabel}
              selectedItemLabelStyle={styles.selectedItemLabel}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
              dropDownDirection="BOTTOM"
              maxHeight={300}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>

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

          {selectedBarangay && (
            <TouchableOpacity 
              style={styles.viewScheduleButton}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.viewScheduleButtonText}>View Schedule Details</Text>
            </TouchableOpacity>
          )}

          <Modal
            visible={showModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Schedule Details</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowModal(false)}
                  >
                    <Ionicons name="close" size={24} color={colors.black} />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={getFilteredSchedules()}
                  renderItem={renderEventItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.modalListContent}
                />
              </View>
            </View>
          </Modal>
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
  dropdownWrapper: {
    marginHorizontal: 10,
    marginTop: 10,
    zIndex: 3000,
    elevation: 5,
  },
  dropdown: {
    backgroundColor: colors.BG_color,
    borderColor: colors.light_gray,
    borderRadius: 8,
    height: 50,
    
  },
  dropdownList: {
    backgroundColor: colors.BG_color,
    borderColor: colors.light_gray,
    marginTop: 2,
    maxHeight: 600,
  },
  placeholderStyle: {
    color: colors.dark_gray,
    fontFamily: 'PSemi-Bold',
    fontSize: 14,
  },
  labelStyle: {
    fontFamily: 'PSemi-Bold',
    fontSize: 14,
    color: colors.black,
  },
  listItemLabel: {
    fontFamily: 'PSemi-Bold',
    fontSize: 14,
  },
  selectedItemLabel: {
    fontFamily: 'PSemi-Bold',
    color: colors.lime_green,
  },
  calendarContainer: {
    backgroundColor: colors.BG_color,
    margin: 10,
    borderRadius: 10,
    elevation: 4,
    paddingBottom: 10,
    marginTop: 10,
    
  },
  calendar: {
    borderRadius: 10,
  },
  viewScheduleButton: {
    backgroundColor: colors.BG_color,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  viewScheduleButtonText: {
    fontFamily: 'PSemi-Bold',
    color: colors.white,
    fontSize: 16,
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
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: 'PSemi-Bold',
    fontSize: 20,
    color: colors.black,
  },
  closeButton: {
    padding: 5,
  },
  modalListContent: {
    paddingBottom: 20,
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
    color: colors.black
  }
});

export default ScheduleScreen;