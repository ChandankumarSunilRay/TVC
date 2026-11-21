import React from "react";
import { Link } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";

const Dashboard = ({ user }) => {
  const { myCourses } = CourseData();
  return (
    <section className="flex-1 bg-slate-50 px-4 py-5 sm:px-6" aria-labelledby="learning-title">
      <div className="mx-auto max-w-[1080px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 id="learning-title" className="text-2xl font-semibold text-slate-900">
              My learning
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, {user?.name?.split(" ")[0] || "learner"}. Choose a course to continue.
            </p>
          </div>
          <Link to="/courses" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 no-underline hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Browse courses
          </Link>
        </div>
        <div className="my-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Your courses</h2>
          <p className="text-sm text-slate-500">
            {myCourses.length} enrolled{" "}
            {myCourses.length === 1 ? "course" : "courses"}
          </p>
        </div>
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myCourses && myCourses.length > 0 ? (
            myCourses.map((course) => (
              <article key={course._id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                <Link to={`/course/study/${course._id}`} tabIndex={-1} aria-hidden="true" className="block bg-slate-100">
                  <img src={course.imageUrl} alt="" loading="lazy" className="h-28 w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-500">
                    <span className="truncate">{course.category}</span>
                    <span className="shrink-0">{course.duration} weeks</span>
                  </div>
                  <h3 className="line-clamp-2 text-lg font-semibold leading-6 text-slate-900">
                    <Link to={`/course/study/${course._id}`} className="hover:text-indigo-700">{course.title}</Link>
                  </h3>
                  <p className="mt-1 truncate text-sm text-slate-500">By {course.createdBy}</p>
                  <Link
                    to={`/course/study/${course._id}`}
                    aria-label={`Continue learning ${course.title}`}
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white no-underline hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Continue learning
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600 sm:col-span-2 lg:col-span-3">
              <h3 className="text-lg font-semibold text-slate-800">
                Your learning library is empty
              </h3>
              <p className="mt-2">
                Explore the catalog and choose your first course.
              </p>
              <Link to="/courses" className="mt-3 inline-flex min-h-11 items-center px-3 text-sm font-medium text-indigo-700 underline underline-offset-4">Find a course</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
