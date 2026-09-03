import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Analysis.css";

export const Analysis = () => {
    const navigate = useNavigate();

    useEffect(() => {
    const timer = setTimeout(() => {
        navigate("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
    }, [navigate]);

    return (
    <div className="analysis">
        <h1>🤖 AI Analysis in Progress</h1>

        <p>Analyzing GitHub Profile...</p>
        <progress value="30" max="100"></progress>

        <p>Reading Resume...</p>
        <progress value="70" max="100"></progress>

        <p>Generating Career Report...</p>
        <progress value="100" max="100"></progress>
    </div>
    );
};