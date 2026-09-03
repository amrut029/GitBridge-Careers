import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GoogleSuccess = () => {

  const navigate = useNavigate();

  useEffect(() => {

    const params = new URLSearchParams(
      window.location.search
    );

    const token = params.get("token");


    if (token) {

      localStorage.setItem(
        "token",
        token
      );


      navigate("/dashboard");

    } else {

      navigate("/login");

    }

  }, [navigate]);


  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f14",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px"
      }}
    >

      Signing you in...

    </div>

  );
};

export default GoogleSuccess;