import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signOut} from "firebase/auth"

const firebaseConfig = {
    apiKey: "AIzaSyBjf3Tn-h3sp8j_Cim3wchwuO3FfVB9uyE",
    authDomain: "fir-login-e3527.firebaseapp.com",
    projectId: "fir-login-e3527",
    storageBucket: "fir-login-e3527.firebasestorage.app",
    messagingSenderId: "1031911845344",
    appId: "1:1031911845344:web:ad615f9b396e099b844f85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// HANDLE GOOGLE LOGIN
const handleGoogleLogin = async (setError) => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google Sign-In:', result.user);
        setError('');
    } catch (err) {
        console.log(err);
        setError('Google Sign-In failed');
    }
}

// HANDLE LOGIN USING EMAIL AND PASSWORD
const handleSubmit = async (e, setError, setMfaResolver) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in:', userCred.user);
    setError('');
    } catch (err) {
    if (err.code === 'auth/multi-factor-auth-required') {
      // Usuario requiere MFA
        console.log('MFA required');
      setMfaResolver(err.resolver); // Guarda para usar luego
    } else {
        setError('Invalid email or password');
    }
    }

    e.target.reset();
};


// Función de Registro con Email and Password


const handleSignUp = async (e, setError, setIsNewlyRegistered) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User registered:', userCred.user);
    setError('');

    // Cierra sesión automáticamente
    await signOut(auth);

    // Activa el estado de "usuario registrado con éxito"
    setIsNewlyRegistered(true);

    } catch (err) {
    console.error(err);
    setError('Error al registrar el usuario');
    }

    e.target.reset();
};



export { auth, googleProvider, handleGoogleLogin, handleSubmit, handleSignUp }
