import { useContext, createContext, useState, useEffect} from "react";
import { Text, SafeAreaView, View, Alert, ActivityIndicator, ToastAndroid } from 'react-native'
import { account } from '../config/appwriteConfig.js';
import colors from '../constant/colors.jsx';
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
            const responseSession = await account.getSession('current');
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

    const signin = async ({email, password}) => {
        setIsLoading(true);
        try {
            const responseSession = await account.createEmailPasswordSession(email, password);
            if (responseSession) {
                setSession(responseSession);
                const responseUser = await account.get();
                setUser(responseUser);
                return true;
            }
        } catch (error) {
            if(error.code === 400) {
                ToastAndroid.show('Invalid email or password!', ToastAndroid.BOTTOM);
            } else if (error.code === 401) {
                ToastAndroid.show('Wrong email or password!', ToastAndroid.BOTTOM);
            }
            setSession(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
        return false;
    };

    const signup = async (ID, email, password, username, location) => {
        setIsLoading(true);
    
        try {
            // Create user account
            const user = await account.create(
                ID,
                email,
                password,
                username
            );
    
            // Update user preferences with location
            await account.updatePrefs({
                username,
                location
            });
    
            // Create email verification
            await account.createVerification(
                'https://localhost:8081/verify' // Replace with your verification URL
            );
            
            return true; // Success
        } catch (error) {
            return false; // Failure
        } finally {
            setIsLoading(false);
        }
    }

     const verifyEmail = async (userId, secret) => {
        setIsLoading(true);
        try {
            await account.updateVerification(userId, secret);
            ToastAndroid.show('Email verified successfully!', ToastAndroid.BOTTOM);
            return true;
        } catch (error) {
            console.error('Verification error:', error);
            ToastAndroid.show('Verification failed: ' + error.message, ToastAndroid.BOTTOM);
            return false;
        } finally {
            setIsLoading(false);
        }
    };
    const signout = async () => {
        setIsLoading(true);
        try {
            await account.deleteSession('current');
            setSession(null);
            setUser(null);
        } catch (error) {
           Alert.alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };


    const contextData = { session, user, signin, signout, signup, isLoading, verifyEmail };
    return (
        <AuthContext.Provider value={contextData}>
            {isLoading ? (
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
}

export { AuthProvider, useAuth, AuthContext };
