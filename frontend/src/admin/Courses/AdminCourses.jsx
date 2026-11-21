import React, { useEffect, useState } from "react";
import { FiImage, FiPlus, FiUploadCloud } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import Layout from "../Utils/Layout";
import { CourseData } from "../../context/CourseContext";
import CourseCard, {
  DeleteCourseButton,
} from "../../components/coursecard/CourseCard";
import { server } from "../../main";

const suggestedCategories = [
  "Web Development",
  "App Development",
  "Data Science",
  "Artificial Intelligence",
  "Cloud Computing",
  "Business",
];
const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const AdminCourses = () => {
  const [imagePreview, setImagePreview] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [pendingError, setPendingError] = useState("");
  const { courses, fetchCourses } = CourseData();

  const changeImageHandler = (event) => {
    const file = event.target.files[0];
    setImagePreview(file ? URL.createObjectURL(file) : "");
  };

  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  async function fetchPendingDeletions() {
    try {
      const { data } = await axios.get(
        `${server}/api/admin/pending-course-deletions`,
        {
          headers: { token: localStorage.getItem("token") },
        },
      );
      setPendingDeletions(data.courses);
      setPendingError("");
    } catch (error) {
      setPendingError(
        error.response?.data?.message || "Unable to load pending deletions",
      );
    }
  }

  useEffect(() => {
    fetchPendingDeletions();
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsPublishing(true);
    try {
      const { data } = await axios.post(
        `${server}/api/course/new`,
        new FormData(form),
        {
          headers: { token: localStorage.getItem("token") },
        },
      );
      toast.success(data.message);
      form.reset();
      setImagePreview("");
      await fetchCourses();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to add course. Please try again.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Layout compact>
      <div className="bg-slate-50 p-3 sm:p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">
              Course management
            </h1>
          </div>
          <span className="text-sm text-slate-500">
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </span>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <div>
            {courses.length ? (
              <div className="grid gap-3 2xl:grid-cols-2">
                {courses.map((course) => (
                  <CourseCard
                    key={course._id}
                    course={course}
                    adminActions
                    compact
                    onDeleteSettled={fetchPendingDeletions}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white py-8 text-center">
                <FiImage className="mx-auto text-4xl text-slate-300" />
                <p className="mt-3 font-bold text-slate-600">
                  No courses published yet
                </p>
              </div>
            )}

            {pendingError && (
              <p
                className="mt-5 rounded-xl bg-red-50 p-4 text-red-700"
                role="alert"
              >
                {pendingError}{" "}
                <button
                  className="font-bold underline"
                  onClick={fetchPendingDeletions}
                >
                  Retry
                </button>
              </p>
            )}
            {pendingDeletions.length > 0 && (
              <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="font-black text-amber-950">
                  Cleanup needs attention
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  These courses are hidden while their media is being removed.
                </p>
                <ul className="mt-4 space-y-3">
                  {pendingDeletions.map((course) => (
                    <li
                      key={course._id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"
                    >
                      <span className="font-bold text-slate-800">
                        {course.title}
                      </span>
                      <DeleteCourseButton
                        courseId={course._id}
                        onDeleteSettled={fetchPendingDeletions}
                      >
                        Retry cleanup
                      </DeleteCourseButton>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-indigo-300">
                  <FiPlus />
                </span>
                <h2 className="text-base font-semibold">Create a course</h2>
              </div>
            </div>
            <form className="space-y-2 p-3" onSubmit={submitHandler}>
              <label className="block text-sm font-bold text-slate-700">
                Course title
                <input
                  className={fieldClass}
                  type="text"
                  name="title"
                  placeholder="e.g. Modern React Foundations"
                  required
                />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Description
                <textarea
                  className={`${fieldClass} resize-y`}
                  name="description"
                  rows="2"
                  placeholder="What will learners achieve?"
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-bold text-slate-700">
                  Price (₹)
                  <input
                    className={fieldClass}
                    type="number"
                    name="price"
                    min="1"
                    required
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Duration
                  <input
                    className={fieldClass}
                    type="number"
                    name="duration"
                    min="1"
                    placeholder="Weeks"
                    required
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-bold text-slate-700">
                  Instructor
                  <input
                    className={fieldClass}
                    type="text"
                    name="createdBy"
                    placeholder="Instructor name"
                    required
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Category
                  <input
                    className={fieldClass}
                    type="text"
                    name="category"
                    list="course-categories"
                    placeholder="Type category"
                    required
                  />
                  <datalist id="course-categories">
                    {suggestedCategories.map((category) => (
                      <option value={category} key={category} />
                    ))}
                  </datalist>
                </label>
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 focus-within:outline-2 focus-within:outline-indigo-600">
                {imagePreview ? (
                  <img src={imagePreview} alt="Selected course thumbnail" className="h-10 w-14 shrink-0 rounded object-cover" />
                ) : (
                  <FiUploadCloud className="shrink-0 text-xl text-indigo-600" />
                )}
                <span>
                  Choose thumbnail
                  <span className="block text-sm text-slate-500">
                    JPG, PNG, WebP or GIF · max 10 MB
                  </span>
                </span>
                <input
                  className="sr-only"
                  type="file"
                  name="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required
                  onChange={changeImageHandler}
                />
              </label>
              <button
                type="submit"
                disabled={isPublishing}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiUploadCloud />{" "}
                {isPublishing ? "Uploading to S3…" : "Publish course"}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default AdminCourses;
