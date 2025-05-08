import React, { useState } from "react";
import { Image, Text, View, StyleSheet, ImageBackground, TouchableOpacity, TextInput, Pressable, Dimensions, KeyboardAvoidingView, Platform,
} from "react-native";
import colors from '../../constant/colors';
import { useRouter } from 'expo-router';

export default function LogIn() {
    const [containerHeight, setContainerHeight] = useState(Dimensions.get('window').height);
    const router = useRouter();

    return (
        <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        >
        <ImageBackground
            source={require('../../assets/images/trece.jpg')}
            style={styles.container}
        >
            {containerHeight > 0 && (
            <Image
                source={require('../../assets/images/logo-modified.png')}
                style={{
                height: containerHeight * 0.3,
                width: containerHeight * 0.25,
                resizeMode: 'contain',
                }}
            />
            )}

            <Text style={styles.title}>Login Your Account</Text>

            <TextInput
            placeholder="Enter Email"
            placeholderTextColor={colors.BG_color}
            style={styles.textInput}
            />
            <TextInput
            placeholder="Enter Password"
            placeholderTextColor={colors.BG_color}
            secureTextEntry={true}
            style={styles.textInput}
            />

            <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('home')}
            >
            <Text style={{ fontFamily: 'PSemi-Bold' }}>Login</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('auth/signup')}>
                <Text style={styles.signUpText}>Sign Up Here</Text>
            </Pressable>
            </View>
        </ImageBackground>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 100,
        padding: 25,
        height: Dimensions.get('window').height,
    },
    textInput: {
        borderColor: colors.BG_color,
        borderWidth: 2,
        marginTop: 15,
        width: '100%',
        borderRadius: 10,
        fontFamily: 'PSemi-Bold',
        fontSize: 15,
        color: colors.BG_color,
    },
    title: {
        marginTop: 10,
        fontFamily: 'PSemi-Bold',
        fontSize: 25,
        color: colors.BG_color,
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    },
    loginButton: {
        marginTop: 15,
        padding: 15,
        backgroundColor: colors.pale_green,
        width: '50%',
        alignItems: 'center',
        borderRadius: 10,
    },
    footer: {
        flexDirection: 'row',
        gap: 3,
        marginTop: 10,
    },
    footerText: {
        fontFamily: 'PSemi-Bold',
        color: colors.BG_color,
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    },
    signUpText: {
        fontFamily: 'PSemi-Bold',
        color: colors.pale_green,
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 10,
    },
});
