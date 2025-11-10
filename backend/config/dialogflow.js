import { SessionsClient } from "@google-cloud/dialogflow";

export const sendToDialogflow = async (message, sessionId) => {
  const sessionClient = new SessionsClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });

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
