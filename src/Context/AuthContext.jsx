import { createContext, useEffect, useState } from "react";
import { auth } from "../Firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });

    return unsubscribe;
    }, []);

    return (
    <AuthContext.Provider value={{ user }}>
        {children}
    </AuthContext.Provider>
    );
};