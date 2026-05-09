// ── My-ICN-JC — Firebase Config ───────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBNf8Bfa0d2jKdldcobTMU3xj7Kwbbu8Tk",
  authDomain: "my-icnjc.firebaseapp.com",
  projectId: "my-icnjc",
  storageBucket: "my-icnjc.firebasestorage.app",
  messagingSenderId: "563677014842",
  appId: "1:563677014842:web:8c9a638556c401066c3e03"
};

// Initialisation unique (évite les doublons si le script est chargé plusieurs fois)
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

const db   = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: 'icnjuniorconseil.com' });

// ── Collections Firestore ──────────────────────────────────────
const COLLECTIONS = {
  users:        db.collection('users'),
  tasks:        db.collection('tasks'),
  kpi:          db.collection('kpi'),
  etudes:       db.collection('etudes'),
  prospects:    db.collection('prospects'),
  clients:      db.collection('clients'),
  intervenants: db.collection('intervenants'),
  partenariats: db.collection('partenariats'),
  evenements:   db.collection('evenements'),
};
