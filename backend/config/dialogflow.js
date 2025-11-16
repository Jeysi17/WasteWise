import { SessionsClient } from "@google-cloud/dialogflow";

export const sendToDialogflow = async (message, sessionId) => {
  // DialogFlow client will automatically look for GOOGLE_APPLICATION_CREDENTIALS
  // environment variable that points to the service account JSON file
  const sessionClient = new SessionsClient();

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