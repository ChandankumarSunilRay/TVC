import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { server } from "../../main";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(`${server}/api/user/forgot`, { email });

      toast.success(data.message);
      navigate("/login");
      setIsSubmitting(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to request a reset link",
      );
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_10%_10%,#e9e3ff,transparent_30%),#f7f8fc] px-5 py-5 sm:py-6">
      <div className="w-full max-w-[390px] rounded-[18px] border border-[#ececf4] bg-white p-6 text-center sm:p-7 shadow-[0_18px_45px_rgba(33,25,74,0.1)] [&_form]:text-left [&_h2]:mb-[15px] [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#17152b] [&_input]:mb-[15px] [&_input]:w-full [&_input]:rounded-[9px] [&_input]:border [&_input]:border-[#dfe1ec] [&_input]:px-3.5 [&_input]:py-[13px] [&_input]:outline-none [&_input:focus]:border-[#8062ff] [&_input:focus]:ring-4 [&_input:focus]:ring-[#8062ff]/15 [&_label]:mb-1 [&_label]:block [&_label]:text-sm [&_label]:text-[#596174]">
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Enter Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            disabled={isSubmitting}
            className="mt-2.5 w-full rounded-[10px] bg-gradient-to-br from-[#6d4aff] to-[#9b5cff] px-[22px] py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSubmitting ? "Please Wait..." : "Forgot Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
