import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../Firebase/firebase";

const ProtectedRoute = ({ children }) => {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setChecking(false);
        });

        return () => unsubscribe();
    }, []);

    // Firebase session check hone tak
    if (checking) {
        return (
        <div
            style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#060816",
            color: "#ffffff",
            fontSize: "16px",
            }}
        >
            Loading...
        </div>
        );
    }

    // Login nahi hai
    if (!user) {
        return <Navigate to="/login" replace />;
    }

  // Login hai
    return children;
};

export default ProtectedRoute;