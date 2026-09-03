import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
} from "firebase/auth";

import { auth } from "../Firebase/firebase";


// ===============================
// GOOGLE PROVIDER
// Create only once
// ===============================
const googleProvider = new GoogleAuthProvider();


// ===============================
// EMAIL SIGNUP
// ===============================
export const emailSignup = async (email, password) => {

    const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    await sendEmailVerification(result.user);

    await signOut(auth);

    return result;
};


// ===============================
// EMAIL LOGIN
// ===============================
export const emailLogin = async (email, password) => {

    const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    if (!result.user.emailVerified) {

        await signOut(auth);

        throw new Error(
            "Please verify your email first. Verification link has been sent to your email."
        );
    }

    return result;
};


// ===============================
// GOOGLE LOGIN
// ===============================
export const googleLogin = async () => {

    const result = await signInWithPopup(
        auth,
        googleProvider
    );

    return result;
};