import admin from "firebase-admin";
import { firebaseConfig } from "./src/firebase-config";
import dotenv from "dotenv";

dotenv.config();

let adminDb: any;

try {
  if (admin.apps.length === 0) {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: serviceAccountEmail,
          privateKey: privateKey,
        })
      });
      console.log("[Firebase Admin] Initialized with Service Account Cert");
    } else {
      // Use application default credentials or just projectId if in Cloud Run
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("[Firebase Admin] Initialized with default credentials/projectId");
    }
  }
  
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  
  if (dbId === '(default)') {
    adminDb = admin.firestore();
  } else {
    adminDb = admin.firestore(dbId);
  }
  
  console.log(`[Firebase Admin] Connecting to database: ${dbId}`);
  
  // Quick probe to verify access
  adminDb.collection('manual_blocks').limit(1).get()
    .then((s: any) => console.log(`[Firebase Admin] Connection verified. Found ${s.size} docs in 'manual_blocks'.`))
    .catch((e: any) => console.error("[Firebase Admin] Connection verification failed:", e.message));
} catch (error) {
  console.error("[Firebase Admin] Initialization failed:", error);
}

export { adminDb };
