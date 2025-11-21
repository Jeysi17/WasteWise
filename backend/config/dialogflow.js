import { SessionsClient } from "@google-cloud/dialogflow";

const getServiceAccount = () => {
  console.log('🔑 Checking Dialogflow credentials...');
  
  // For production (EAS/Render) - using environment variables
  if (process.env.GOOGLE_PRIVATE_KEY) {
    console.log('✅ Using environment variable credentials');
    
    // Validate required environment variables
    if (!process.env.GOOGLE_PROJECT_ID) {
      throw new Error('GOOGLE_PROJECT_ID environment variable is required');
    }
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('GOOGLE_CLIENT_EMAIL environment variable is required');
    }
    
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    console.log('📋 Credentials summary:', {
      projectId: process.env.GOOGLE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKeyLength: privateKey.length,
      privateKeyStartsWith: privateKey.substring(0, 30) + '...',
      privateKeyEndsWith: '...' + privateKey.substring(privateKey.length - 20)
    });

    return {
      type: process.env.GOOGLE_TYPE || 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: privateKey,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    };
  }
  
  // For development - using GOOGLE_APPLICATION_CREDENTIALS environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('✅ Using GOOGLE_APPLICATION_CREDENTIALS file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    // Let Dialogflow handle the file path automatically
    return null;
  }
  
  console.error('❌ No Dialogflow credentials found');
  throw new Error('Dialogflow service account configuration not found. Please set GOOGLE_PRIVATE_KEY or GOOGLE_APPLICATION_CREDENTIALS environment variables.');
};

export const sendToDialogflow = async (message, sessionId) => {
  console.log('🚀 Starting Dialogflow request...');
  
  try {
    const serviceAccount = getServiceAccount();
    
    const config = {};
    
    // Only add credentials if we're using environment variables (not file path)
    if (serviceAccount) {
      config.credentials = serviceAccount;
      console.log('🔐 Configuring Dialogflow with service account credentials');
    } else {
      console.log('🔐 Dialogflow will use GOOGLE_APPLICATION_CREDENTIALS automatically');
    }

    const sessionClient = new SessionsClient(config);
    console.log('✅ Dialogflow client initialized');

    const projectId = process.env.DIALOGFLOW_PROJECT_ID || 
                     process.env.GOOGLE_PROJECT_ID || 
                     'wastewise-gach';
    
    console.log('🎯 Using project ID:', projectId);
    console.log('💬 Session ID:', sessionId);
    
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    console.log('📍 Session path:', sessionPath);
    
    const request = {
      session: sessionPath,
      queryInput: {
        text: { 
          text: message, 
          languageCode: "en-US" 
        },
      },
    };

    console.log('📤 Sending detectIntent request...');
    const [response] = await sessionClient.detectIntent(request);
    console.log('✅ Dialogflow response received');
    
    return response.queryResult;
    
  } catch (error) {
    console.error('❌ Dialogflow API Error Details:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
    
    // Enhanced error handling for common Dialogflow issues
    if (error.code === 16 || error.message?.includes('UNAUTHENTICATED')) {
      console.error('🔐 AUTHENTICATION FAILURE - Check:');
      console.error('1. Service account credentials');
      console.error('2. Project ID matches service account');
      console.error('3. Dialogflow API is enabled in Google Cloud');
      throw new Error('Dialogflow authentication failed. Check service account configuration.');
    }
    
    if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      console.error('🚫 PERMISSION DENIED - Check:');
      console.error('1. Service account has Dialogflow API User role');
      console.error('2. Project has Dialogflow API enabled');
      throw new Error('Dialogflow permission denied. Check service account permissions.');
    }
    
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('EAI_AGAIN')) {
      console.error('🌐 NETWORK ERROR - Check internet connection and DNS');
      throw new Error('Network error connecting to Dialogflow service.');
    }

    // Don't expose sensitive error details
    const safeError = new Error('Failed to process message with chat service');
    safeError.originalError = process.env.NODE_ENV === 'development' ? error.message : 'hidden';
    throw safeError;
  }
};