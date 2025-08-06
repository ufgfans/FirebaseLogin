import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Cargar credenciales del service account.
// 1. Permitir variable de entorno GOOGLE_APPLICATION_CREDENTIALS.
// 2. Intentar serviceAccount.json en la carpeta actual.
// 3. Intentar ../serviceAccount.json si se lanzó desde /backend.

let serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  // Si existe serviceAccount.json en cwd
  const localPath = path.resolve(process.cwd(), 'serviceAccount.json');
  if (fs.existsSync(localPath)) {
    serviceAccountPath = localPath;
  } else {
    // Probar un nivel arriba (cuando se arranca dentro de backend/)
    const parentPath = path.resolve(process.cwd(), '../serviceAccount.json');
    if (fs.existsSync(parentPath)) {
      serviceAccountPath = parentPath;
    }
  }
}

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error('\n❌  No se encontró serviceAccount.json. Establece GOOGLE_APPLICATION_CREDENTIALS o coloca el archivo en la raíz o en backend/.\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

const db = admin.firestore();
const app = express();

// CORS: permitir origen del frontend (Vite)
app.use(cors({ origin: 'http://localhost:5173' }));

app.use(express.json());

// Rate-limit: 100 peticiones cada 15 minutos para /mfa/*
const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/mfa', mfaLimiter);

// Utils
const secretsCollection = db.collection('mfa_secrets');

// POST /mfa/generate
app.post('/mfa/generate', async (req, res) => {
  const { uid, email } = req.body;
  if (!uid || !email) return res.status(400).json({ error: 'uid and email required' });

  try {
    // Generar secreto TOTP
    const secret = speakeasy.generateSecret({ name: `MVP (${email})` });

    // Guardar en Firestore
    await secretsCollection.doc(uid).set({
      secret: secret.base32,
      lastMfaVerified: 0,
    });

    // Generar QR data URL
    const otpauth = secret.otpauth_url;
    const qrDataURL = await QRCode.toDataURL(otpauth);
    res.json({ qrDataURL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// POST /mfa/verify
app.post('/mfa/verify', async (req, res) => {
  const { uid, token } = req.body;
  if (!uid || !token) return res.status(400).json({ error: 'uid and token required' });

  try {
    const docRef = secretsCollection.doc(uid);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: 'secret_not_found' });

    const { secret } = docSnap.data();
    const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });

    if (!verified) return res.status(401).json({ error: 'invalid_token' });

    const now = Date.now();
    await docRef.update({ lastMfaVerified: now });

    // Emitir custom token con claim mfa:true
    const custom = await admin.auth().createCustomToken(uid, { mfa: true });
    res.json({ custom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Middleware para rutas protegidas (ejemplo)
app.use('/secure', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'missing_token' });

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, mfa } = decoded;

    if (!mfa) return res.status(401).json({ error: 'mfa_required' });

    // Verificar expiración 5 min
    const docSnap = await secretsCollection.doc(uid).get();
    const { lastMfaVerified } = docSnap.data();
    if (Date.now() - lastMfaVerified > 5 * 60 * 1000) {
      return res.status(440).json({ error: 'mfa_expired' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'invalid_token' });
  }
});

// Ruta protegida demo
app.get('/secure/hello', (req, res) => {
  res.json({ message: `Hola ${req.user.uid}, acceso concedido!` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🔥 Backend MFA corriendo en http://localhost:${PORT}`));
