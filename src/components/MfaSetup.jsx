import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';
import { auth } from '../firebase';
import { signInWithCustomToken, signOut } from 'firebase/auth';

export default function MfaSetup({ user, onComplete }) {
  const [qr, setQr] = useState(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Al montar, solicitar QR si no existe.
    const fetchQr = async () => {
      try {
        console.log('Fetching QR for user:', user.uid, user.email);
        const { data } = await api.post(`/mfa/generate`, {
          uid: user.uid,
          email: user.email,
        });
        console.log('QR response:', data);
        setQr(data.qrDataURL);
      } catch (err) {
        console.error('QR generation error:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        setError(`Error generando QR: ${err.response?.data?.error || err.message}`);
      }
    };
    fetchQr();
  }, [user]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/mfa/verify`, {
        uid: user.uid,
        token,
      });
      await signInWithCustomToken(auth, data.custom);
      onComplete();
    } catch (err) {
      console.error(err);
      setError('Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Cierra sesión y vuelve a la vista de login
    await signOut(auth);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-500 via-gray-700 to-gray-900 px-4 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Verificación en dos pasos</h2>
        {qr ? (
          qr.startsWith('data:image') ? (
            <img src={qr} alt="QR" className="mx-auto mb-4 bg-white p-2 w-48 h-48" />
          ) : (
            <QRCodeSVG value={qr} size={200} className="mx-auto mb-4 bg-white p-2" />
          )
        ) : (
          <p>Cargando QR...</p>
        )}
        <p className="mb-4">Escanea el código con Google Authenticator y escribe el código de 6 dígitos.</p>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="000000"
            required
            className="w-full text-white px-3 py-2 rounded mb-4 text-center tracking-widest"
          />
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Verificando…' : 'Verificar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
