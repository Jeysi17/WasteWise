// dialogflowService.js
import axios from 'axios';

// Replace with your actual values
const DIALOGFLOW_PROJECT_ID = 'wastewise-gach';
const SESSION_ID = 'user-session-1234'; // Can be device ID or UUID
const LANGUAGE_CODE = 'en';
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Generate with service account for now

export const sendToDialogflow = async (text) => {
  const url = `https://dialogflow.googleapis.com/v2/projects/${DIALOGFLOW_PROJECT_ID}/agent/sessions/${SESSION_ID}:detectIntent`;

  const body = {
    queryInput: {
      text: {
        text,
        languageCode: LANGUAGE_CODE,
      },
    },
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    return response.data.queryResult.fulfillmentText;
  } catch (error) {
    console.error('Dialogflow error:', error.response?.data || error.message);
    return 'Sorry, I couldn’t understand that.';
  }
};
