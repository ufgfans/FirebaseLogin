import admin from 'firebase-admin';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  // In Vercel, we'll use environment variables for the service account
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;
    
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();

// CORS configuration
export const corsOptions = {
  origin: true, // Allow all origins for now to debug
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Rate limiting for MFA endpoints
export const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Wrapper to handle CORS and common middleware
export function withMiddleware(handler) {
  return async (req, res) => {
    // Handle CORS
    const corsHandler = cors(corsOptions);
    await new Promise((resolve, reject) => {
      corsHandler(req, res, (result) => {
        if (result instanceof Error) return reject(result);
        return resolve(result);
      });
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Middleware to verify Firebase token for protected routes
export async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new Error('missing_token');
  }

  const idToken = authHeader.split('Bearer ')[1];
  const decoded = await auth.verifyIdToken(idToken);
  return decoded;
}
