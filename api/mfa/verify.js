import speakeasy from 'speakeasy';
import { db, auth, withMiddleware } from '../_utils.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, token } = req.body;
  if (!uid || !token) {
    return res.status(400).json({ error: 'uid and token required' });
  }

  try {
    const secretsCollection = db.collection('mfa_secrets');
    const docRef = secretsCollection.doc(uid);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'secret_not_found' });
    }

    const { secret } = docSnap.data();
    const verified = speakeasy.totp.verify({ 
      secret, 
      encoding: 'base32', 
      token, 
      window: 1 
    });

    if (!verified) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    const now = Date.now();
    await docRef.update({ lastMfaVerified: now });

    // Issue custom token with mfa:true claim
    const custom = await auth.createCustomToken(uid, { mfa: true });
    res.json({ custom });
  } catch (err) {
    console.error('MFA Verify Error:', err);
    res.status(500).json({ error: 'server_error' });
  }
}

export default withMiddleware(handler);
