import React from "react";
import { CourseData } from "../../context/CourseContext";
import CourseCard from "../../components/coursecard/CourseCard";

const Courses = () => {
  const { courses } = CourseData();

  return (
    <section className="flex-1 bg-slate-50 px-5 py-9 sm:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-indigo-600">
            Course catalog
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Choose what you want to learn next
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Practical, self-paced courses designed to help you build confidence
            through focused lessons.
          </p>
        </div>
        <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses && courses.length > 0 ? (
            courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))
          ) : (
            <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600 md:col-span-2 xl:col-span-3">
              No courses are available yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Courses;
