import React, { useState } from "react";
import {
  FiBookOpen,
  FiEdit3,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";
import { server } from "../../main";

const Account = ({ user }) => {
  const { setIsAuth, setUser } = UserData();
  const { myCourses } = CourseData();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    location: user.location || "",
    bio: user.bio || "",
  });

  const initials =
    user.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VC";
  const updateField = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.patch(`${server}/api/user/profile`, form, {
        headers: { token: localStorage.getItem("token") },
      });
      setUser(data.user);
      setEditing(false);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activationToken");
    setUser([]);
    setIsAuth(false);
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <section className="flex-1 bg-slate-50 px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-[1080px]">
        <div className="grid items-start gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 bg-slate-950 p-4 text-white">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-indigo-500 text-lg font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="break-words text-lg font-semibold">{user.name}</h1>
                <p className="mt-0.5 text-sm text-slate-300">
                  {user.role === "admin"
                    ? "Course administrator"
                    : "Learner account"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 p-2 md:grid-cols-1">
              <button
                onClick={() => setEditing(false)}
                aria-pressed={!editing}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-700"
              >
                <FiUser /> Profile overview
              </button>
              <button
                onClick={() => setEditing(true)}
                aria-pressed={editing}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 aria-pressed:bg-indigo-50 aria-pressed:text-indigo-700"
              >
                <FiEdit3 /> Edit profile
              </button>
              {user.role !== "admin" && (
                <button
                  onClick={() => navigate(`/${user._id}/dashboard`)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <FiBookOpen /> My learning
                </button>
              )}
              {user.role === "admin" && (
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <FiShield /> Admin workspace
                </button>
              )}
              <button
                onClick={logoutHandler}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <FiLogOut /> Log out
              </button>
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {editing ? "Edit your profile" : "Profile details"}
                  </h2>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FiEdit3 /> Edit details
                  </button>
                )}
              </div>

              {editing ? (
                <form
                  onSubmit={saveProfile}
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                >
                  <label className="text-sm font-bold text-slate-700">
                    Full name
                    <input
                      name="name"
                      value={form.name}
                      onChange={updateField}
                      maxLength="60"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </label>
                  <label className="text-sm font-bold text-slate-700">
                    Phone
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={updateField}
                      maxLength="20"
                      placeholder="Optional"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </label>
                  <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                    Location
                    <input
                      name="location"
                      value={form.location}
                      onChange={updateField}
                      maxLength="80"
                      placeholder="City, state"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </label>
                  <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                    Short bio
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={updateField}
                      maxLength="240"
                      rows="2"
                      placeholder="Tell instructors a little about your learning goals"
                      className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <span className="mt-1 block text-right text-sm text-slate-500">
                      {form.bio.length}/240
                    </span>
                  </label>
                  <div className="flex gap-3 sm:col-span-2">
                    <button
                      disabled={saving}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      <FiSave /> {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 grid gap-x-5 gap-y-1 sm:grid-cols-2">
                  <Detail icon={<FiMail />} label="Email" value={user.email} />
                  <Detail
                    icon={<FiPhone />}
                    label="Phone"
                    value={user.phone || "Not added"}
                  />
                  <Detail
                    icon={<FiMapPin />}
                    label="Location"
                    value={user.location || "Not added"}
                  />
                  {user.role !== "admin" && (
                    <Detail
                      icon={<FiBookOpen />}
                      label="Enrolled courses"
                      value={String(myCourses.length)}
                    />
                  )}
                  <div className="mt-2 border-t border-slate-100 pt-3 sm:col-span-2">
                    <p className="text-sm text-slate-500">
                      About
                    </p>
                    <p className="mt-1 break-words text-sm leading-6 text-slate-700">
                      {user.bio ||
                        "Add a short bio and your learning goals to complete your profile."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {user.role !== "admin" && myCourses.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      Your courses
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate(`/${user._id}/dashboard`)}
                    className="min-h-11 px-2 py-2 text-sm font-medium text-indigo-700"
                  >
                    View all
                  </button>
                </div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {myCourses.slice(0, 2).map((course) => (
                    <Link
                      key={course._id}
                      to={`/course/study/${course._id}`}
                      className="flex items-center gap-3 p-3 text-slate-800 no-underline hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:-outline-offset-2"
                    >
                      <img src={course.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded object-cover" loading="lazy" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{course.title}</span>
                        <span className="block text-sm text-slate-500">{course.duration} weeks</span>
                      </span>
                      <span className="shrink-0 text-sm font-medium text-indigo-700">Open</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Detail = ({ icon, label, value }) => (
  <div className="flex min-w-0 items-start gap-2 py-2.5">
    <span className="mt-1 shrink-0 text-slate-400" aria-hidden="true">{icon}</span>
    <div className="min-w-0">
      <p className="text-sm text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-800 [overflow-wrap:anywhere]">{value}</p>
    </div>
  </div>
);

export default Account;
