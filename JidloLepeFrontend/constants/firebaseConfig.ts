import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {getFirestore} from "@firebase/firestore";
export const firebaseConfig = {
    apiKey: "AIzaSyBvG8Nhw7E-4CiiQ5_Jh3xR1qaaRp0NT6Y",
    authDomain: "jidlo-lepe-9b542.firebaseapp.com",
    projectId: "jidlo-lepe-9b542",
    storageBucket: "jidlo-lepe-9b542.firebasestorage.app",
    messagingSenderId: "254745062967",
    appId: "1:254745062967:web:6b883fb69aedf66ac119b2",
    measurementId: "G-JDD0MLP8PW"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Inicializace Firestore
const db = getFirestore(app);

export { db, auth };