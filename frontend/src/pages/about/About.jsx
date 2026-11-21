import React from "react";
import { Link } from "react-router-dom";
import { FiBookOpen, FiPlayCircle, FiCheckCircle } from "react-icons/fi";

const About = () => {
  return (
    <section className="flex-1 bg-slate-50 px-4 py-6 sm:px-6 sm:py-8" aria-labelledby="about-title">
      <div className="mx-auto max-w-[1080px]">
        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-10">
          <div>
            <p className="mb-2 text-sm font-medium text-indigo-700">About the campus</p>
            <h1 id="about-title" className="max-w-xl font-serif text-3xl leading-tight text-slate-900 sm:text-4xl">
              A small campus, wherever you learn.
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-slate-600">
              The Virtual Campus brings video courses and your learning progress
              into one place. Choose a subject, work through the lessons, and
              return to your courses when you have time.
            </p>
            <p className="mt-3 max-w-xl leading-7 text-slate-600">
              The idea is simple: keep the course easy to follow and make it
              clear what you have already completed.
            </p>
            <Link to="/courses" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600">
              Browse the courses
            </Link>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="about-how-title">
            <h2 id="about-how-title" className="text-base font-semibold text-slate-900">How learning works here</h2>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <FiBookOpen className="mt-1 shrink-0 text-indigo-600" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Find a course</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Check the overview, instructor, duration, and price before enrolling.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FiPlayCircle className="mt-1 shrink-0 text-indigo-600" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Watch the lessons</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Open your enrolled courses and choose a lecture at your own pace.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FiCheckCircle className="mt-1 shrink-0 text-indigo-600" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Keep track</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Lessons are marked complete when their videos reach the end.</p>
                </div>
              </li>
            </ul>
          </aside>
        </div>

        <div className="mt-7 grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] sm:gap-10">
          <div>
            <h2 className="text-base font-semibold text-slate-900">A student-built project</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Built by Chandankumar Sunil Ray as a full-stack learning project,
              The Virtual Campus connects the learner experience with the work
              behind it: publishing courses, managing lectures, and handling enrollment.
            </p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Have a question?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              For course access, payment questions, or feedback, visit the{" "}
              <Link to="/contact" className="font-medium text-indigo-700 underline underline-offset-4">contact page</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
