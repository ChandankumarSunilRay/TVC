import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";

const Login = () => {
  const navigate = useNavigate(); // browser navigation hook
  const { isSubmitting, loginUser } = UserData(); // account actions shared by UserContext
  const [email, setEmail] = useState(""); // state for email input
  const [password, setPassword] = useState(""); // state for password input

  const { fetchMyCourses } = CourseData(); // refreshes owned courses after login

  const submitHandler = async (event) => {
    event.preventDefault();
    await loginUser(email, password, navigate, fetchMyCourses);
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_10%_10%,#e9e3ff,transparent_30%),#f7f8fc] px-5 py-5 sm:py-6">
      <div className="w-full max-w-[390px] rounded-[18px] border border-[#ececf4] bg-white p-6 text-center sm:p-7 shadow-[0_18px_45px_rgba(33,25,74,0.1)] [&_form]:text-left [&_h2]:mb-[15px] [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#17152b] [&_input]:mb-[15px] [&_input]:w-full [&_input]:rounded-[9px] [&_input]:border [&_input]:border-[#dfe1ec] [&_input]:px-3.5 [&_input]:py-[13px] [&_input]:outline-none [&_input:focus]:border-[#8062ff] [&_input:focus]:ring-4 [&_input:focus]:ring-[#8062ff]/15 [&_label]:mb-1 [&_label]:block [&_label]:text-sm [&_label]:text-[#596174] [&_a]:text-[#6848e8]">
        <h2>Login</h2>
        <form onSubmit={submitHandler}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            disabled={isSubmitting}
            type="submit"
            className="mt-2.5 w-full rounded-[10px] bg-gradient-to-br from-[#6d4aff] to-[#9b5cff] px-[22px] py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSubmitting ? "Please Wait..." : "Login"}
          </button>
        </form>
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p>
          <Link to="/forgot">Forgot password?</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
