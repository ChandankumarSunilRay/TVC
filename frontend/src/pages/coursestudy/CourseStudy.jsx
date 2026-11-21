import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiPlayCircle,
  FiUser,
} from "react-icons/fi";
import { useCourse } from "../../context/CourseContext";
import Loading from "../../components/loading/Loading";

const CourseStudy = ({ user }) => {
  const { id } = useParams();
  const { course, error } = useCourse(id);

  if (user && user.role !== "admin" && !user.subscription?.includes(id)) {
    return <Navigate to="/" replace />;
  }
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <p
          className="rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-700"
          role="alert"
        >
          {error}
        </p>
      </div>
    );
  }
  if (!course) return <Loading />;

  const dashboardPath =
    user?.role === "admin"
      ? "/admin/course"
      : user?._id
        ? `/${user._id}/dashboard`
        : "/courses";
  const actionLabel =
    user?.role === "admin" ? "Manage lectures" : "Start learning";

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top_left,_#e8e7ff,_transparent_32%),linear-gradient(135deg,_#f8fafc,_#f4f2ff)] px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link
          to={dashboardPath}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-indigo-700"
        >
          <FiArrowLeft />{" "}
          {user?.role === "admin" ? "Back to courses" : "Back to my learning"}
        </Link>

        <article className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_80px_rgba(51,46,99,0.13)]">
          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="relative min-h-[220px] overflow-hidden bg-slate-200 lg:min-h-[320px]">
              <img
                className="absolute inset-0 h-full w-full object-cover"
                src={course.imageUrl}
                alt={`${course.title} course cover`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/5 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-indigo-700 shadow-lg">
                {course.category}
              </span>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-bold text-indigo-200">
                  Your enrolled course
                </p>
                <p className="mt-1 max-w-md text-2xl font-black leading-tight sm:text-3xl">
                  {course.title}
                </p>
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-9 lg:p-12">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-indigo-600">
                  Course workspace
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  {course.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                  {course.description}
                </p>
              </div>

              <dl className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <FiUser className="text-indigo-600" /> Instructor
                  </dt>
                  <dd className="mt-2 font-extrabold text-slate-900">
                    {course.createdBy}
                  </dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <FiClock className="text-indigo-600" /> Duration
                  </dt>
                  <dd className="mt-2 font-extrabold text-slate-900">
                    {course.duration} weeks
                  </dd>
                </div>
              </dl>

              <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
                    <FiBookOpen />
                  </span>
                  <div>
                    <h2 className="font-extrabold text-slate-950">
                      Your curriculum is ready
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Open the lecture workspace to watch lessons and track
                      completed lectures.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-indigo-100 pt-4 text-sm font-bold text-emerald-700">
                  <FiCheckCircle /> Course access active
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
                <Link
                  to={`/lectures/${course._id}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-600"
                >
                  <FiPlayCircle /> {actionLabel} <FiArrowRight />
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3.5 font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  Browse courses
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
};

export default CourseStudy;
