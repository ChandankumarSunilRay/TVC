import axios from "axios";
import { server } from "../main";
import toast, { Toaster } from "react-hot-toast";
import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext(); // context created here
export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loginUser(email, password, navigate, fetchMyCourses) {
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${server}/api/user/login`, {
        email: email,
        password: password,
      });

      toast.success(data.message);
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setIsAuth(true);
      setIsSubmitting(false);
      navigate("/");
      fetchMyCourses();
    } catch (error) {
      setIsSubmitting(false);
      setIsAuth(false);
      toast.error(
        error.response?.data?.message || "Could not sign in. Try again.",
      );
    }
  }

  async function registerUser(name, email, password, navigate) {
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${server}/api/user/register`, {
        name,
        email,
        password,
      });

      toast.success(data.message);
      localStorage.setItem("activationToken", data.activationToken);
      setIsSubmitting(false);
      navigate("/verify");
    } catch (error) {
      setIsSubmitting(false);
      toast.error(
        error.response?.data?.message || "Could not register. Try again.",
      );
    }
  }

  async function verifyOtp(otp, navigate) {
    setIsSubmitting(true);
    const activationToken = localStorage.getItem("activationToken");
    try {
      const { data } = await axios.post(`${server}/api/user/verify`, {
        otp,
        activationToken,
      });

      toast.success(data.message);
      navigate("/login");
      localStorage.removeItem("activationToken");
      setIsSubmitting(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not verify the code. Try again.",
      );
      setIsSubmitting(false);
    }
  }

  async function fetchUser() {
    try {
      const { data } = await axios.get(`${server}/api/user/me`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      setIsAuth(true);
      setUser(data.user);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        setIsAuth,
        isAuth,
        loginUser,
        isSubmitting,
        btnLoading: isSubmitting,
        loading,
        registerUser,
        verifyOtp,
        fetchUser,
      }}
    >
      {children}
      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ top: 24, left: 16, right: 16 }}
        toastOptions={{
          duration: 4500,
          style: {
            width: "min(420px, calc(100vw - 32px))",
            maxWidth: "420px",
            padding: "14px 16px",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            boxShadow: "0 14px 35px rgba(15, 23, 42, 0.14)",
            color: "#334155",
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: 1.45,
          },
          success: {
            style: {
              background: "#f0fdf4",
              borderColor: "#bbf7d0",
              color: "#166534",
            },
            iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
          },
          error: {
            style: {
              background: "#fff7f7",
              borderColor: "#fecaca",
              color: "#991b1b",
            },
            iconTheme: { primary: "#ef4444", secondary: "#fff7f7" },
          },
        }}
      />
    </UserContext.Provider>
  );
};

export const UserData = () => useContext(UserContext);
