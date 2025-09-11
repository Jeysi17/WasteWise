import { Client, Account, ID } from 'react-native-appwrite';
import { Platform } from 'react-native';

// Validate environment variables
const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const packageName = process.env.EXPO_PUBLIC_APPWRITE_PACKAGE_NAME;

if (!endpoint || !projectId) {
  throw new Error(
    'Appwrite configuration missing. Please set EXPO_PUBLIC_APPWRITE_ENDPOINT and EXPO_PUBLIC_APPWRITE_PROJECT_ID in your environment variables.'
  );
}

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject(projectId);

// Only set platform if packageName exists
if (packageName) {
  client.setPlatform(packageName);
}

const account = new Account(client);

export { account, ID };