import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children, compact = false }) => {
  return (
    <div className={`mx-auto flex w-[96%] max-w-[1400px] flex-1 overflow-hidden border border-slate-200 bg-white ${compact ? "my-2 rounded-xl shadow-sm" : "my-4 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:my-5"}`}>
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

export default Layout;
