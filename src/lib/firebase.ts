// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "fitness-circle-v9lme",
  appId: "1:477375716953:web:54346e4b29a8d60c8a5b48",
  storageBucket: "fitness-circle-v9lme.firebasestorage.app",
  apiKey: "AIzaSyAqi5ScFpSg3_W-ml2wygHOpW5kL9ozTPs",
  authDomain: "fitness-circle-v9lme.firebaseapp.com",
  messagingSenderId: "477375716953",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
