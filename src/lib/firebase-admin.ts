import admin from "firebase-admin";

// التحقق من وجود admin.credential
console.log("🔍 Checking admin.credential:", typeof admin.credential);

if (!admin.apps || admin.apps.length === 0) {
  console.log("🔧 Initializing Firebase Admin...");

  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: "googleapis.com",
  };

  try {
    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error);
  }
} else {
  console.log("ℹ️ Firebase Admin already initialized");
}

/**
 * إرسال إشعار دفع لمستخدم واحد
 */
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    const message = {
      notification: { title, body },
      data: data || {},
      token,
    };
    const response = await admin.messaging().send(message);
    console.log("✅ Push sent successfully:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Error sending push:", error);
    return { success: false, error };
  }
};

export default admin;