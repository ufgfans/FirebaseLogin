# 🔐 UFG Fans – Firebase DIY MFA (TOTP) React + Node

![banner](docs/banner.png)

Proyecto **full-stack** que demuestra cómo añadir **autenticación multifactor (MFA) TOTP** “haz-lo-tú-mismo” sobre **Firebase Auth** sin usar Identity Platform, usando:

* **Frontend**: React + Vite + Tailwind
* **Backend**: Node 18 + Express + Firestore + Speakeasy + Firebase Admin
* **Infra**: Vercel (Frontend + Backend serverless functions)

> Perfecto para aprender seguridad 2FA, custom claims de Firebase y despliegue gratuito.

---

## ✨ Funcionalidades

| Módulo | Descripción |
| ------- | ----------- |
| 🔑 Login social/email | Firebase Auth (email+password, Google) |
| 🔐 MFA DIY (TOTP) | QR con Speakeasy, verificación 6 dígitos, custom token con `mfa:true` |
| 📦 API protegida | Middleware que exige MFA y expira a los 5 min (HTTP 440) |
| 🌐 CORS flexible | Permite localhost, Railway/Vercel y dominios custom |
| 🛡️ Rate limiting | 100 req/15 min en rutas `/mfa/*` |
| 📱 UX cuidada | Dark UI, botón cancelar MFA, manejo de expiración |

---

## 🗺️ Arquitectura

```
React + Vite (SPA)  --->  Express API (/mfa/*, /secure/*)  --->  Firestore
                 |                                     ↘  Firebase Admin SDK
                 |                                      ↘ Speakeasy (TOTP)
                 ↘———— custom token (mfa:true) <—————↗
```

---

## 🚀 Demo

👉 **Frontend**: <https://firebaselogin.vercel.app>  
👉 **Backend**   : <https://firebaselogin.vercel.app/api/mfa/generate>

> El backend se sirve como *Vercel Functions* bajo `/api/*`.

---

## 🛠️ Instalación local

```bash
# Clona y entra
git clone https://github.com/tu-usuario/ufgfans.git && cd ufgfans

# Instala deps (root = frontend)
npm install

# Backend deps
cd backend && npm install && cd ..

# Copia credenciales Firebase Admin
cp serviceAccount.example.json serviceAccount.json

# Arranca todo
a) Backend: cd backend && node index.js
b) Frontend: npm run dev
```

### Variables de entorno (root)

```
# .env       (no se commitea)
VITE_FB_API_KEY=⚠️
VITE_FB_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FB_PROJECT_ID=tu-proyecto
VITE_API_URL=http://localhost:4000
```

### Scripts útiles

| Comando | Descripción |
| ------- | ----------- |
| `npm run dev` | Vite dev server |
| `npm run build` | Build producción (dist/) |
| `npm run preview` | Pre-visualizar build |
| `npm start` | (en Vercel) Inicia backend Express |

---

## ☁️ Despliegue en Vercel

1. **Import Project** desde GitHub.  
2. **Root**: `/` (monorepo simple).  
3. **Build Command**: `npm run build`  
4. **Output**: `dist` (Frontend) – Vercel detectará Functions auto en `/api/*`.  
5. Añade **Environment Variables** (pantalla *Settings → Environment Variables*):

   | Nombre | Ejemplo |
   | ------ | ------- |
   | `VITE_FB_API_KEY` | `AIzaSy...` |
   | `VITE_FB_AUTH_DOMAIN` | `proyecto.firebaseapp.com` |
   | `VITE_FB_PROJECT_ID` | `proyecto` |
   | `VITE_API_URL` | `https://<project>.vercel.app/api` |
   | `GOOGLE_APPLICATION_CREDENTIALS` | `/var/task/serviceAccount.json` |

6. Sube `serviceAccount.json` a la sección **Files** o como *Secret* y referencia la ruta anterior.

---

## 📡 Endpoints API

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| `POST` | `/api/mfa/generate` | Genera secreto TOTP y devuelve `qrDataURL` |
| `POST` | `/api/mfa/verify` | Verifica código, devuelve `custom` token |
| `GET`  | `/api/secure/hello` | Ejemplo de ruta protegida (requiere MFA) |

---

## 🔒 Seguridad

* TOTP secreto almacenado cifrado en Firestore (*.to-be-implemented*).  
* `lastMfaVerified` para expiración (5 min).  
* Rate-limit middleware.  
* Reglas Firestore recomendadas:

```firestore
match /users/{uid} {
  allow read, write: if request.auth.uid == uid && request.auth.token.mfa == true;
}
```

---

## 🤝 Contribuir

1. Haz un fork ✨
2. Crea tu rama `feat/tu-feature`  
3. `npm run lint && npm test`  
4. Abre PR   🙌

---

## 📄 Licencia

[MIT](LICENSE) — libre para uso y modificación; se agradece atribución.

---

> Hecho con ❤️ por @ufgfans. ¡Que disfrutes programando con MFA seguro! 🎉
