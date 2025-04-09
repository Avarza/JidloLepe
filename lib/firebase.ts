// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "@/constants/firebaseConfig";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
