import { useContext, createContext, useState, useEffect } from "react";
import { Text, SafeAreaView, View, Alert, ActivityIndicator, ToastAndroid } from "react-native";
import { account, ID } from "../config/appwriteConfig";
import colors from "../constant/colors.jsx";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

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
      // ✅ Auto-generate a safe userId
      const newUser = await account.create(ID.unique(), email, password, username);

      // ✅ Create a temporary session (required to send verification email)
      await account.createEmailPasswordSession(email, password);

      // ✅ Send verification email with deep link redirect
      await account.createVerification("https://melodic-lolly-0f1b14.netlify.app/");


      // ✅ Log them out again (so they must verify before signing in)
      await account.deleteSession("current");

      ToastAndroid.show(
        "Signup successful! Please check your email to verify.",
        ToastAndroid.LONG
      );

      return true;
    } catch (error) {
      console.error("Signup error:", error);
      ToastAndroid.show("Signup failed: " + error.message, ToastAndroid.LONG);
      return false;
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
    } catch (error) {
      Alert.alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const contextData = {
    session,
    user,
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
