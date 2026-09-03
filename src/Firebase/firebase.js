import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDfuPovrFyHFQWR8DS8UI6RBz-V-kt7j3Q",
    authDomain: "gitbridge-ai.firebaseapp.com",
    projectId: "gitbridge-ai",
    storageBucket: "gitbridge-ai.firebasestorage.app",
    messagingSenderId: "519959004268",
    appId: "1:519959004268:web:fa320d5ec3254777528449",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);