import { SessionsClient } from "@google-cloud/dialogflow";

// Convert JSON string from env variable to object
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);

export const sendToDialogflow = async (message, sessionId) => {
  // Initialize SessionsClient with credentials object
  const sessionClient = new SessionsClient({ credentials });

  const sessionPath = sessionClient.projectAgentSessionPath(
    process.env.DIALOGFLOW_PROJECT_ID,
    sessionId
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: { text: message, languageCode: "en-US" },
    },
  };

  const [response] = await sessionClient.detectIntent(request);
  return response.queryResult;
};
