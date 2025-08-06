import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { db, withMiddleware } from '../_utils.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, email } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'uid and email required' });
  }

  try {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({ name: `MVP (${email})` });

    // Save to Firestore
    const secretsCollection = db.collection('mfa_secrets');
    await secretsCollection.doc(uid).set({
      secret: secret.base32,
      lastMfaVerified: 0,
    });

    // Generate QR data URL
    const otpauth = secret.otpauth_url;
    const qrDataURL = await QRCode.toDataURL(otpauth);
    
    res.json({ qrDataURL });
  } catch (err) {
    console.error('MFA Generate Error:', err);
    res.status(500).json({ error: 'server_error' });
  }
}

export default withMiddleware(handler);
