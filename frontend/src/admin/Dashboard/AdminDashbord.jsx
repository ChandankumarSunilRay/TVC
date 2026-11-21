import React, { useEffect, useState } from "react";
import { FiBookOpen, FiFilm, FiPlus, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../Utils/Layout";
import { server } from "../../main";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalLectures: 0,
    totalUsers: 0,
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function fetchStats() {
    try {
      const { data } = await axios.get(`${server}/api/stats`, {
        headers: { token: localStorage.getItem("token") },
      });
      setStats({
        ...data.stats,
        totalCourses: data.stats.totalCourses ?? data.stats.totalCoures ?? 0,
      });
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load dashboard statistics",
      );
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = [
    {
      label: "Published courses",
      value: stats.totalCourses,
      icon: <FiBookOpen />,
      tone: "bg-indigo-600",
    },
    {
      label: "Video lectures",
      value: stats.totalLectures,
      icon: <FiFilm />,
      tone: "bg-sky-600",
    },
    {
      label: "Registered learners",
      value: stats.totalUsers,
      icon: <FiUsers />,
      tone: "bg-emerald-600",
    },
  ];

  return (
    <Layout>
      <div className="h-full bg-slate-50 p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-indigo-600">
              Admin workspace
            </p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">
              Campus overview
            </h1>
            <p className="mt-2 text-slate-600">
              A quick view of your learning catalog and community.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/course")}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-extrabold text-white hover:bg-indigo-600"
          >
            <FiPlus /> Create course
          </button>
        </div>
        {error && (
          <p
            className="mt-6 rounded-xl bg-red-50 p-4 text-red-700"
            role="alert"
          >
            {error}{" "}
            <button onClick={fetchStats} className="font-bold underline">
              Retry
            </button>
          </p>
        )}
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl text-xl text-white ${card.tone}`}
              >
                {card.icon}
              </span>
              <p className="mt-4 text-4xl font-black text-slate-950">
                {card.value}
              </p>
              <p className="mt-1 font-bold text-slate-500">{card.label}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm font-bold text-indigo-300">NEXT STEP</p>
          <h2 className="mt-2 text-2xl font-black">Keep the catalog fresh</h2>
          <p className="mt-2 max-w-xl leading-7 text-slate-300">
            Add a focused course, upload its lectures, and verify the learner
            experience before sharing your public link.
          </p>
          <button
            onClick={() => navigate("/admin/course")}
            className="mt-4 rounded-xl bg-indigo-500 px-5 py-3 font-bold hover:bg-indigo-400"
          >
            Manage courses
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
