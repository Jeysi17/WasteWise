import { React} from 'react';
import * as Notifications from 'expo-notifications';
import OneSignal from 'react-native-onesignal';

export const initNotifications = (userBarangay) => {
  // Initialize OneSignal
  OneSignal.setAppId("YOUR_ONESIGNAL_APP_ID");
  
  // Set the barangay tag for this user
  OneSignal.sendTag("barangay", userBarangay.toLowerCase());
  
  // Configure how notifications are displayed when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Handle notifications when app is opened from a notification
  OneSignal.setNotificationOpenedHandler((notification) => {
    console.log("Notification opened:", notification);
    // You can navigate to specific screens based on the notification data
  });
  
  // Handle notifications received while in foreground
  OneSignal.setNotificationWillShowInForegroundHandler((event) => {
    let notification = event.getNotification();
    console.log("Notification received in foreground:", notification);
    event.complete(notification);
  });
};