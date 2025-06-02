import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
} catch (error) {
  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
  serviceAccount = {};
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw new Error('Failed to initialize Firebase Admin. Please check your service account credentials.');
  }
}

// Function to set admin claims
export const setAdminClaim = async (uid) => {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    return true;
  } catch (error) {
    console.error('Error setting admin claim:', error);
    return false;
  }
};

// Function to check if user is admin
export const isAdmin = async (uid) => {
  try {
    const user = await admin.auth().getUser(uid);
    return user.customClaims?.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export default admin; 