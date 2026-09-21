import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseClientConfig, isFirebaseConfigured } from "./config";

export { isFirebaseConfigured };

function requireConfig(): void {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase client env vars are missing. Copy .env.example to .env.local and fill in NEXT_PUBLIC_FIREBASE_*.",
    );
  }
}

export function getFirebaseApp(): FirebaseApp {
  requireConfig();
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseClientConfig);
}

export function getClientAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getClientDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
