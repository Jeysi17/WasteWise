import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, ImageBackground, Dimensions, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import colors from '../../constant/colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
const ProfileScreen = () => {
    const [containerHeight] = useState(Dimensions.get('window').height);
    const [activeTab, setActiveTab] = useState('Pending');
    const pendingComplaints = [
        { title: 'Complaint A', time: '00:12', date: '12/04/2025' },
        { title: 'Complaint B', time: '01:45', date: '12/04/2025' },
    ];

    const completedComplaints = [
        { title: 'Complaint C', time: '05:23', date: '12/01/2025' },
        { title: 'Complaint D', time: '07:10', date: '11/30/2025' },
    ];
    const { user, signout } = useAuth();
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLocation();
    }, []);

    const fetchLocation = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_HOST_URL}/location?userEmail=${encodeURIComponent(user.email)}`
            );
            const data = await response.json();
            
            if (data.error) {
                setError(data.error);
            } else {
                setLocation(data.location); 
            }
        } catch (err) {
            setError('Failed to fetch location');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg_green }}>
        <ScrollView contentContainerStyle={{ paddingBottom: '38%' }}>
            <ImageBackground
                source={require('../../assets/images/bg-image.jpg')}
                style={{
                height: containerHeight * 0.23,
                width: '100%',
                backgroundColor: 'rgb(0, 0, 0)',
                borderBottomWidth: 7,
                borderBottomColor: colors.border_green,
                }}
            />
            <View
                style={{
                ...StyleSheet.absoluteFillObject,
                height: containerHeight * 0.23,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderBottomWidth: 6,
                borderColor:  colors.border_green,
                }}
            />
            <View style={{
                top: 137,
            }}>
                <View style={styles.profileImageContainer}>
                    <Image
                    source={require('../../assets/images/alden.jpg')}
                    style={styles.profileImage}
                    />
                </View>
                <View style={styles.profileDetails}>
                    <Text style={styles.Name}>
                        {user.name} | {location ? `${location}` : <ActivityIndicator size="small" color="#0000ff" />}
                    </Text>
                    <Text style={styles.Details}>{user.email}</Text>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                </View>
            </View>
            <View style={styles.navbar}>
                <TouchableOpacity
                    style={[
                    styles.tabButton,
                    activeTab === 'Pending' && styles.activeTab
                    ]}
                    onPress={() => setActiveTab('Pending')}
                >
                    <Text style={styles.tabText}>Pending</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                    styles.tabButton,
                    activeTab === 'Completed' && styles.activeTab
                    ]}
                    onPress={() => setActiveTab('Completed')}
                >
                    <Text style={styles.tabText}>Completed</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.tabContent}>
                {(activeTab === 'Pending' ? pendingComplaints : completedComplaints).map((item, index) => (
                    <Text key={index} style={styles.listItem}>
                    • {item.title} | {item.time} | {item.date}
                    </Text>
                ))}
            </View>                         
        </ScrollView>
       
    </GestureHandlerRootView>
    );
};
export default ProfileScreen;

const styles = StyleSheet.create({
    profileImageContainer: {
        position: 'absolute',
        bottom: 85,
        left: 0,
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: 60,

    },
    profileImage: {
        height: 100,
        width: 100,
        borderRadius: 50,
        borderWidth: 5,
        borderColor: colors.border_green,
    },
    profileDetails: {
        width: 370,
        height: 52,
        position: 'absolute',
        bottom: 85,
        left: 15,
        zIndex: 9,
        backgroundColor: colors.pale_green,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 50,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderColor: colors.border_green,
    },
    Name: {
        fontSize: 16,
        left: 87,
        padding: 2,
        borderBottomWidth: 2,
        width: 189,
        borderColor: colors.border_green,
    },
    Details: {
        fontSize: 16,
        left: 87,
    },
    navbar: {
        flexDirection: 'row',
        width: '90%',
        alignSelf: 'center',
        marginTop: 80,
        backgroundColor: colors.pale_green,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: colors.border_green,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: colors.border_green,
    },
    tabText: {
        color: 'black',
        fontWeight: 'bold',
    },
    tabContent: {
        marginHorizontal: 20,
        backgroundColor: colors.pale_green,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: colors.border_green,
    },
    listItem: {
        fontSize: 16,
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#ccc',
    },
    signOut: {
        backgroundColor: colors.pale_green,
        marginTop: 10,
        width: '30%',
        height: 50,
        padding: 5,
        alignSelf: 'center',
        borderRadius: 10
    },
    signOutText: {
        fontFamily: 'PSemi-Bold',
        textAlign: 'center',
        marginTop: 8
    }
});