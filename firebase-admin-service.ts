import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { firebaseConfig } from "./src/firebase-config";
import dotenv from "dotenv";

dotenv.config();

let adminDb: Firestore | any;

try {
  let app: App;
  const existingApps = getApps();
  
  if (existingApps.length === 0) {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountEmail && privateKey) {
      app = initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: serviceAccountEmail,
          privateKey: privateKey,
        })
      });
      console.log("[Firebase Admin] Initialized with Service Account Cert");
    } else {
      // Use application default credentials or just projectId if in Cloud Run
      app = initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("[Firebase Admin] Initialized with default credentials/projectId");
    }
  } else {
    app = existingApps[0];
  }
  
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  
  // In firebase-admin v10+, specify database via first string argument OR provide app instance
  if (dbId === '(default)') {
    adminDb = getFirestore(app);
  } else {
    try {
      // @ts-ignore - Some versions might have different signatures but this is generally supported
      adminDb = getFirestore(app, dbId);
    } catch (e) {
      console.warn(`[Firebase Admin] Could not initialize with dbId ${dbId}, falling back to default:`, (e as Error).message);
      adminDb = getFirestore(app);
    }
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
