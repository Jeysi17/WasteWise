// config/FirebaseConfig.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC3tnUeVRHlDtW-76XFSx0iMXmv80VtyDE",
  authDomain: "wastewise-app-5613d.firebaseapp.com",
  projectId: "wastewise-app-5613d",
  storageBucket: "wastewise-app-5613d.appspot.com",
  messagingSenderId: "637189153747",
  appId: "1:637189153747:web:26bfb59cc38a8125c80526",
};

let app: FirebaseApp;

// ✅ Initialize Firebase only once
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized:", app.name);
} else {
  app = getApp();
  console.log("ℹ️ Firebase already initialized:", app.name);
}

export { app };
