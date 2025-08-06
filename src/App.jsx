import React, { useEffect, useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { handleGoogleLogin, handleSubmit, handleSignUp, auth } from './Config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import userDefault from './assets/user.png';
import MfaSetup from './components/MfaSetup';
import api from './api';

const App = () => {
  const [formVisible, setFormVisible] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [hasMfa, setHasMfa] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); 
  const [isNewlyRegistered, setIsNewlyRegistered] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        currentUser.getIdTokenResult().then((res) => {
          setHasMfa(res.claims?.mfa === true);
        });
        setImgSrc(currentUser.photoURL);
      }
    });
    setTimeout(() => setFormVisible(true), 500);
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (isNewlyRegistered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-800 text-white p-6">
        <h1 className="text-3xl font-bold mb-4">Cuenta creada exitosamente</h1>
        <p className="mb-6 text-lg">Ahora puedes iniciar sesión con tu cuenta.</p>
        <button
          onClick={() => {
            setIsNewlyRegistered(false);
            setIsSignUp(false); 
          }}
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
        >
          Regresar al Login
        </button>
      </div>
    );
  }

  if (user && !hasMfa) {
    return <MfaSetup user={user} onComplete={() => window.location.reload()} />;
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-500 via-gray-700 to-gray-900 px-4">
        <div className="relative bg-gray-800 text-white shadow-lg rounded-lg p-10 max-w-md w-full border border-gray-700 hover:shadow-[0_0_25px_5px_rgba(56,140,248,1)] transition duration-300">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6 text-center">Perfil de Usuario</h1>
            <img
              src={imgSrc || userDefault}
              onError={() => setImgSrc(userDefault)}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full mb-6 border-4 border-cyan-400 object-cover shadow-lg"
            />
            <div className="text-center">
              <p className="text-2xl font-semibold mb-2">{user.displayName || 'Nombre no disponible'}</p>
              <p className="text-gray-400 mb-6">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className='mt-4 w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 rounded-lg hover:bg-gradient-to-l hover:from-red-600 hover:to-pink-600 transition-all duration-300 focus:ring focus:ring-red-300 focus:outline-none shadow-md hover:shadow-lg'
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-500 via-gray-700 to-gray-900 px-4'>
      <div className={`relative bg-gray-800 text-white shadow-lg rounded-lg p-10 max-w-md w-full border border-gray-700 hover:shadow-[0_0_25px_5px_rgba(56,140,248,1)] transition duration-300
        ${formVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'} transform transition-all duration-500 ease-out`}>

        <h2 className='text-3xl font-bold text-center mb-4'>
          {isSignUp ? 'Crea una cuenta' : 'Bienvenido'}
        </h2>
        <p className='text-gray-400 text-center mb-6'>
          {isSignUp ? 'Regístrate' : 'Inicia sesión en tu cuenta'}
        </p>

        {error && <p className='text-red-500 text-center mb-4'>{error}</p>}

        <form
          onSubmit={(e) =>
            isSignUp
            ? handleSignUp(e, setError, setIsNewlyRegistered)
            : handleSubmit(e, setError)
              }
        >
          <div>
            <label htmlFor="email" className='block text-gray-300 font-medium mb-1'>Dirección de correo</label>
            <input required type="email" name='email' id='email' placeholder='Ingresa tu correo' className='w-full border-b border-gray-600 bg-transparent text-white px-2 py-1 focus:border-cyan-400 focus:outline-none' />
          </div>

          <div className='relative'>
            <label htmlFor="password" className='block text-gray-300 font-medium mb-1'>Contraseña</label>
            <input type={passwordVisible ? 'text' : 'password'} id='password' name='password' placeholder='Ingresa tu contraseña' className='w-full border-b border-gray-600 bg-transparent text-white px-2 py-1 focus:border-cyan-400 focus:outline-none' />
            <button type='button' onClick={() => setPasswordVisible(!passwordVisible)} className='absolute right-2 top-8 text-gray-400 hover:text-cyan-400 focus:outline-none'>
              {passwordVisible ? <AiOutlineEyeInvisible className='h-5 w-5' /> : <AiOutlineEye className='w-5 h-5' />}
            </button>
          </div>

          <button type='submit' className='mt-5 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 rounded-lg hover:bg-gradient-to-l hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 focus:ring focus:ring-cyan-300 focus:outline-none shadow-md hover:shadow-lg'>
            {isSignUp ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </form>

        <div className='mt-8 flex items-center justify-between'>
          <span className='border-b w-1/4 border-gray-600'></span>
          <span className='text-gray-400 text-sm'>O</span>
          <span className='border-b w-1/4 border-gray-600'></span>
        </div>

        <button onClick={() => handleGoogleLogin(setError)} className='mt-6 w-full flex items-center justify-center bg-gray-700 border border-gray-600 py-2 rounded-lg shadow-md hover:bg-gray-600 hover:shadow-lg transition-all duration-300 focus:ring focus:ring-cyan-300 focus:outline-none'>
          <FcGoogle className='h-6 w-6 mr-3' />
          Continúa con Google
        </button>

        <p className='text-center text-gray-400 text-sm mt-6'>
          {isSignUp ? '¿Ya tienes una cuenta?' : "¿No tienes una cuenta?"}{' '}
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className='text-cyan-400 hover:underline'>
            {isSignUp ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default App;
