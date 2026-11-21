import React, { useState } from "react";
import { FiArrowUpRight, FiBookOpen, FiClock, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { server } from "../../main";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";

export function DeleteCourseButton({
  courseId,
  onDeleteSettled,
  children = "Delete",
}) {
  const { fetchCourses } = CourseData();
  const [busy, setBusy] = useState(false);

  const deleteHandler = async () => {
    if (!confirm("Delete this course and all of its lectures?")) return;
    setBusy(true);
    try {
      const { data } = await axios.delete(`${server}/api/course/${courseId}`, {
        headers: { token: localStorage.getItem("token") },
      });
      toast.success(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to finish deleting the course",
      );
    } finally {
      await Promise.all([fetchCourses(), onDeleteSettled?.()]);
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={deleteHandler}
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FiTrash2 /> {busy ? "Deleting…" : children}
    </button>
  );
}

const CourseCard = ({ course, onDeleteSettled, adminActions = false, compact = false }) => {
  const navigate = useNavigate();
  const { user } = UserData();
  const enrolled = user?.subscription?.includes(course._id);
  const destination =
    enrolled || user?.role === "admin"
      ? `/course/study/${course._id}`
      : `/course/${course._id}`;

  if (compact) {
    return (
      <article className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <img src={course.imageUrl} alt="" loading="lazy" className="h-16 w-16 rounded-lg object-cover" />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-900">{course.title}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">By {course.createdBy}</p>
          <p className="mt-1 text-sm text-slate-500">{course.duration} weeks · ₹{course.price}</p>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
          <button type="button" onClick={() => navigate(destination)} className="min-h-11 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">
            {user?.role === "admin" ? "Manage lectures" : "Continue learning"}
          </button>
          {adminActions && user?.role === "admin" && (
            <DeleteCourseButton courseId={course._id} onDeleteSettled={onDeleteSettled} />
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_60px_rgba(79,70,229,0.14)]">
      <button
        type="button"
        onClick={() => navigate(destination)}
        className="relative block overflow-hidden text-left"
      >
        <img
          src={course.imageUrl}
          alt={course.title}
          className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-indigo-700 shadow-sm">
          {course.category}
        </span>
      </button>
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-sm font-semibold text-indigo-600">
          {course.createdBy}
        </p>
        <h3 className="line-clamp-2 text-xl font-extrabold leading-snug text-slate-900">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {course.description}
        </p>
        <div className="mt-5 flex items-center gap-4 border-y border-slate-100 py-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <FiClock /> {course.duration} weeks
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FiBookOpen /> Self-paced
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Course fee
            </span>
            <p className="text-xl font-black text-slate-900">₹{course.price}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(destination)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-600"
          >
            {enrolled || user?.role === "admin" ? "Continue" : "View course"}{" "}
            <FiArrowUpRight />
          </button>
        </div>
        {adminActions && user?.role === "admin" && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <DeleteCourseButton
              courseId={course._id}
              onDeleteSettled={onDeleteSettled}
            />
          </div>
        )}
      </div>
    </article>
  );
};

export default CourseCard;
