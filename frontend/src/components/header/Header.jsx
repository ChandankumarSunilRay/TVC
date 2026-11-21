import React from "react";
import { Link, NavLink } from "react-router-dom";

const Header = ({ isAuth }) => {
  const navClass = ({ isActive }) => (isActive ? "!text-indigo-600" : "");

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-[clamp(16px,6vw,88px)] py-4 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-3 no-underline" aria-label="The Virtual Campus home">
        <img src="/favicon.svg" alt="" width="40" height="40" className="h-10 w-10 shrink-0" />
        <span className="hidden text-lg font-black tracking-[-0.5px] text-slate-950 sm:inline md:text-xl">
          The Virtual Campus
        </span>
      </Link>

      <nav
        className="flex items-center gap-2 sm:gap-3 md:gap-7 [&_a]:text-sm [&_a]:font-bold [&_a]:text-slate-600 [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:text-indigo-600"
        aria-label="Main navigation"
      >
        <NavLink className={navClass} to="/">
          Home
        </NavLink>
        <NavLink className={navClass} to="/courses">
          Courses
        </NavLink>
        <NavLink className={navClass} to="/about">
          About
        </NavLink>
        {isAuth ? (
          <NavLink className={navClass} to="/account">
            Account
          </NavLink>
        ) : (
          <NavLink
            className="rounded-xl! bg-slate-950! px-3! py-2.5! text-white! hover:bg-indigo-600! sm:px-4!"
            to="/login"
          >
            Sign in
          </NavLink>
        )}
      </nav>
    </header>
  );
};

export default Header;
