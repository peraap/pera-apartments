import admin from "firebase-admin";
import { firebaseConfig } from "./src/firebase-config";
import dotenv from "dotenv";

dotenv.config();

let adminDb: any;

try {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Handle escaped newlines in private key
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (serviceAccountEmail && privateKey) {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: serviceAccountEmail,
          privateKey: privateKey,
        })
      });
    }
    
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    
    if (dbId === '(default)') {
      adminDb = admin.firestore();
    } else {
      adminDb = admin.firestore(dbId);
    }
    
    console.log("[Firebase Admin] Initialized successfully");
    
    // Quick probe to verify access
    adminDb.collection('manual_blocks').limit(1).get()
      .then((s: any) => console.log(`[Firebase Admin] Connection to manual_blocks verified. Found ${s.size} docs.`))
      .catch((e: any) => console.error("[Firebase Admin] Connection verification failed:", e.message));
  } else {
    console.warn("[Firebase Admin] Missing service account credentials.");
  }
} catch (error) {
  console.error("[Firebase Admin] Initialization failed:", error);
}

export { adminDb };
