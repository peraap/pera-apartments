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
      // In newer firebase-admin versions, this is the preferred way for named databases
      adminDb = getFirestore(app, dbId);
    } catch (e) {
      console.warn(`[Firebase Admin] Could not initialize with dbId ${dbId}, falling back to default:`, (e as Error).message);
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
