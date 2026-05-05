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
      console.log(`[Firebase Admin] Attempting initialization with service account: ${serviceAccountEmail}`);
      app = initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: serviceAccountEmail,
          privateKey: privateKey,
        })
      });
      console.log("[Firebase Admin] Initialized with Service Account Cert");
    } else {
      console.log(`[Firebase Admin] No service account credentials found in environment. Using default for project: ${firebaseConfig.projectId}`);
      // Use application default credentials or just projectId if in Cloud Run
      app = initializeApp({
        projectId: firebaseConfig.projectId,
      });
      console.log("[Firebase Admin] Initialized with default credentials/projectId");
    }
  } else {
    app = existingApps[0];
    console.log("[Firebase Admin] Using existing app instance");
  }
  
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  console.log(`[Firebase Admin] Database ID from config: ${dbId}`);
  
  // In firebase-admin v10+, specify database via first string argument OR provide app instance
  if (dbId === '(default)') {
    adminDb = getFirestore(app);
  } else {
    try {
      console.log(`[Firebase Admin] Attempting to connect to named database: ${dbId}`);
      // In newer firebase-admin versions, this is the preferred way for named databases
      adminDb = getFirestore(app, dbId);
      console.log(`[Firebase Admin] Successfully obtained Firestore instance for ${dbId}`);
    } catch (e) {
      console.error(`[Firebase Admin] CRITICAL: Could not initialize with dbId ${dbId}:`, (e as Error).message);
      adminDb = getFirestore(app);
    }
  }
  
  console.log(`[Firebase Admin] Connecting to database: ${dbId} in project: ${firebaseConfig.projectId}`);
  
  // Quick probe to verify access - wrap in catch to prevent startup crash
  try {
    adminDb.collection('apartments').limit(1).get()
      .then((s: any) => console.log(`[Firebase Admin] Database access verified. Found ${s.size} apartments.`))
      .catch((e: any) => {
        console.warn("[Firebase Admin] Access verification warning:", e.message);
        console.warn("[Firebase Admin] This might be due to missing collections or restricted IAM roles. Continuing anyway...");
      });
  } catch (probeError) {
    console.warn("[Firebase Admin] Probe failed to start:", (probeError as Error).message);
  }
} catch (error) {
  console.error("[Firebase Admin] Initialization failed:", error);
}

export { adminDb };
