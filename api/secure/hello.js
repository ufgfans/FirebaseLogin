import { db, verifyToken, withMiddleware } from '../_utils.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Firebase token
    const decoded = await verifyToken(req);
    const { uid, mfa } = decoded;

    if (!mfa) {
      return res.status(401).json({ error: 'mfa_required' });
    }

    // Verify MFA hasn't expired (5 minutes)
    const secretsCollection = db.collection('mfa_secrets');
    const docSnap = await secretsCollection.doc(uid).get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'mfa_not_setup' });
    }

    const { lastMfaVerified } = docSnap.data();
    if (Date.now() - lastMfaVerified > 5 * 60 * 1000) {
      return res.status(440).json({ error: 'mfa_expired' });
    }

    res.json({ message: `Hola ${uid}, acceso concedido!` });
  } catch (err) {
    console.error('Secure Hello Error:', err);
    if (err.message === 'missing_token') {
      return res.status(401).json({ error: 'missing_token' });
    }
    res.status(401).json({ error: 'invalid_token' });
  }
}

export default withMiddleware(handler);
