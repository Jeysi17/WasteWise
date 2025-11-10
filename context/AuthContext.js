import { useContext, createContext, useState, useEffect } from "react";
import { Text, SafeAreaView, View, Alert, ActivityIndicator, ToastAndroid } from "react-native";
import { account, ID } from "../config/appwriteConfig";
import colors from "../constant/colors.jsx";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // ✅ added: store user’s barangay/location
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const responseSession = await account.getSession("current");
      if (responseSession) {
        setSession(responseSession);
        const responseUser = await account.get();
        setUser(responseUser);

        // ✅ Fetch user’s barangay/location from your backend
        if (responseUser.email) {
          try {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_HOST_URL}/api/users/location?userEmail=${responseUser.email}`
            );
            const data = await res.json();
            if (data?.location) {
              setUserLocation(data.location);
              console.log("📍 User barangay fetched:", data.location);
            } else {
              console.log("⚠️ No location returned for user:", responseUser.email);
            }
          } catch (fetchError) {
            console.error("❌ Failed to fetch user location:", fetchError);
          }
        }
      }
    } catch (error) {
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signin = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const responseSession = await account.createEmailPasswordSession(email, password);
      if (responseSession) {
        const responseUser = await account.get();
  
        // ✅ block unverified users
        if (!responseUser.emailVerification) {
          await account.deleteSession("current");
          ToastAndroid.show("Please verify your email before signing in.", ToastAndroid.LONG);
          return false;
        }
  
        setSession(responseSession);
        setUser(responseUser);
  
        // ✅ Fetch and store barangay/location after login
        try {
          // Fixed: Use the correct endpoint (added /users/)
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_HOST_URL}/api/users/location?userEmail=${responseUser.email}`
          );
          
          // ✅ Check response status
          if (!res.ok) {
            console.error(`❌ HTTP error! status: ${res.status}`);
            return true; // Still allow login to succeed
          }
          
          // ✅ Get raw text first
          const text = await res.text();
          
          // ✅ Check for HTML
          if (text.trim().startsWith('<')) {
            console.error("❌ Received HTML instead of JSON");
            return true; // Still allow login to succeed
          }
          
          // ✅ Parse JSON safely
          const data = JSON.parse(text);
          
          if (data?.location) {
            setUserLocation(data.location);
            console.log("📍 User barangay fetched after login:", data.location);
          }
        } catch (fetchError) {
          console.error("❌ Failed to fetch user location after login:", fetchError);
          // Don't throw - allow login to succeed even if location fetch fails
        }
  
        return true;
      }
    } catch (error) {
      if (error.code === 400) {
        ToastAndroid.show("Invalid email or password!", ToastAndroid.BOTTOM);
      } else if (error.code === 401) {
        ToastAndroid.show("Wrong email or password!", ToastAndroid.BOTTOM);
      } else {
        ToastAndroid.show("Login failed: " + error.message, ToastAndroid.LONG);
      }
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const signup = async (email, password, username, location) => {
    setIsLoading(true);
    try {
      const newUser = await account.create(ID.unique(), email, password, username);
  
      // create a temp session (needed for verification)
      await account.createEmailPasswordSession(email, password);
  
      // send verification email
      await account.createVerification("https://melodic-lolly-0f1b14.netlify.app/");
  
      // log them out again
      await account.deleteSession("current");
  
      ToastAndroid.show(
        "Signup successful! Please check your email to verify.",
        ToastAndroid.LONG
      );
  
      return newUser; // 👈 return the Appwrite user, not just `true`
    } catch (error) {
      console.error("Signup error:", error);
      ToastAndroid.show("Signup failed: " + error.message, ToastAndroid.LONG);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (userId, secret) => {
    setIsLoading(true);
    try {
      console.log("🔎 verifyEmail called with:", { userId, secret });
      const result = await account.updateVerification(String(userId), String(secret));
      console.log("✅ Appwrite verification success:", result);
      return true;
    } catch (error) {
      console.error("❌ Appwrite verification error:", error);
      ToastAndroid.show("Verification failed: " + error.message, ToastAndroid.LONG);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signout = async () => {
    setIsLoading(true);
    try {
      await account.deleteSession("current");
      setSession(null);
      setUser(null);
      setUserLocation(null); // ✅ clear barangay on logout
    } catch (error) {
      Alert.alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Include location in context data
  const contextData = {
    session,
    user,
    userLocation,
    setUserLocation,
    signin,
    signout,
    signup,
    isLoading,
    verifyEmail,
  };

  return (
    <AuthContext.Provider value={contextData}>
      {isLoading ? (
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.lime_green} />
        </SafeAreaView>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthProvider, useAuth, AuthContext };
