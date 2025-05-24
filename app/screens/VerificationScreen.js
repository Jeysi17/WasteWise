// screens/VerificationScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Linking } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const VerificationScreen = ({ route }) => {
  const { verifyEmail } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Get verification parameters from deep link or route params
        const { userId, secret } = route.params || {};
        
        if (!userId || !secret) {
          throw new Error('Missing verification parameters');
        }

        const result = await verifyEmail(userId, secret);
        setVerificationStatus('success');
      } catch (err) {
        setError(err.message);
        setVerificationStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    handleVerification();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Verifying your email...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {verificationStatus === 'success' ? (
        <>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>✅ Verification Complete</Text>
          <Text style={{ textAlign: 'center' }}>
            Your email address has been verified successfully.
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: 'red' }}>
            ❌ Verification Failed
          </Text>
          <Text style={{ textAlign: 'center', color: 'red' }}>
            ⚠️ Reason: {error}
          </Text>
        </>
      )}
    </View>
  );
};

export default VerificationScreen;