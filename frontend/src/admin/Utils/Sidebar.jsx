import React from "react";
import { FiBookOpen, FiHome, FiUser, FiUsers } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { UserData } from "../../context/UserContext";

const Sidebar = () => {
  const { user } = UserData();
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl p-3 text-sm font-bold no-underline transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`;

  return (
    <aside className="w-[68px] shrink-0 border-r border-slate-200 bg-white p-3 md:w-[230px] md:p-5">
      <div className="mb-6 hidden md:block">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">
          Workspace
        </p>
        <h2 className="mt-1 text-xl font-black text-slate-950">
          Administration
        </h2>
      </div>
      <nav className="space-y-2" aria-label="Admin navigation">
        <NavLink className={navClass} to="/admin/dashboard">
          <FiHome className="shrink-0 text-lg" />
          <span className="hidden md:inline">Overview</span>
        </NavLink>
        <NavLink className={navClass} to="/admin/course">
          <FiBookOpen className="shrink-0 text-lg" />
          <span className="hidden md:inline">Courses</span>
        </NavLink>
        {user?.mainrole === "superadmin" && (
          <NavLink className={navClass} to="/admin/users">
            <FiUsers className="shrink-0 text-lg" />
            <span className="hidden md:inline">Users</span>
          </NavLink>
        )}
        <NavLink className={navClass} to="/account">
          <FiUser className="shrink-0 text-lg" />
          <span className="hidden md:inline">My account</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
