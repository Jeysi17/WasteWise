import { SessionsClient } from "@google-cloud/dialogflow";

const getServiceAccount = () => {
  // For production (EAS/Render) - using environment variables
  if (process.env.GOOGLE_PRIVATE_KEY) {
    return {
      type: process.env.GOOGLE_TYPE || 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID || process.env.DIALOGFLOW_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    };
  }
  
  // For development - using GOOGLE_APPLICATION_CREDENTIALS environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Let Dialogflow handle the file path automatically
    return null;
  }
  
  throw new Error('Dialogflow service account configuration not found. Please set environment variables.');
};

export const sendToDialogflow = async (message, sessionId) => {
  try {
    const serviceAccount = getServiceAccount();
    
    const config = {};
    
    // Only add credentials if we're using environment variables (not file path)
    if (serviceAccount) {
      config.credentials = serviceAccount;
    }
    // If GOOGLE_APPLICATION_CREDENTIALS is set, Dialogflow will use it automatically
    // so we don't need to provide credentials in the config

    const sessionClient = new SessionsClient(config);

    const projectId = process.env.DIALOGFLOW_PROJECT_ID || 
                     process.env.GOOGLE_PROJECT_ID || 
                     'wastewise-gach';
    
    const sessionPath = sessionClient.projectAgentSessionPath(
      projectId,
      sessionId
    );
    
    const request = {
      session: sessionPath,
      queryInput: {
        text: { 
          text: message, 
          languageCode: "en-US" 
        },
      },
    };

    const [response] = await sessionClient.detectIntent(request);
    return response.queryResult;
    
  } catch (error) {
    console.error('Dialogflow API Error:', error);
    
    // Don't expose sensitive error details
    const safeError = new Error('Failed to process message with chat service');
    safeError.originalError = process.env.NODE_ENV === 'development' ? error.message : 'hidden';
    throw safeError;
  }
};  