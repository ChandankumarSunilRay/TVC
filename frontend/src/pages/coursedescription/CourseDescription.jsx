import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CourseData, useCourse } from "../../context/CourseContext";
import { server } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { UserData } from "../../context/UserContext";
import Loading from "../../components/loading/Loading";
import {
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiUser,
} from "react-icons/fi";

const CourseDescription = ({ user }) => {
  const { id } = useParams();
  const { course, error } = useCourse(id);
  if (error) return <p role="alert">{error}</p>;
  if (!course) return <Loading />;
  return <CoursePurchase key={course._id} course={course} user={user} />;
};

const CoursePurchase = ({ course, user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const activePayment = useRef(null);
  const { fetchUser } = UserData();
  const { fetchCourses, fetchMyCourse } = CourseData();

  useEffect(() => () => activePayment.current?.abort(), []);

  const checkoutHandler = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const token = localStorage.getItem("token");
    const controller = new AbortController();
    activePayment.current = controller;
    setLoading(true);

    try {
      if (!window.Razorpay) {
        throw new Error("Payment gateway is unavailable. Please try again.");
      }
      const {
        data: { order, key },
      } = await axios.post(
        `${server}/api/course/checkout/${course._id}`,
        {},
        {
          signal: controller.signal,
          headers: {
            token,
          },
        },
      );

      if (controller.signal.aborted) return;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "The Virtual Campus",
        description: course.title,
        order_id: order.id,
        handler: async function (response) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            response;

          try {
            const { data } = await axios.post(
              `${server}/api/verification/${course._id}`,
              {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
              },
              {
                headers: {
                  token,
                },
              },
            );

            await fetchUser();
            await fetchCourses();
            await fetchMyCourse();
            toast.success(data.message);
            if (!controller.signal.aborted)
              navigate(`/payment-success/${razorpay_payment_id}`);
          } catch (error) {
            toast.error(
              error.response?.data?.message || "Payment verification failed",
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: {
          color: "#8a4baf",
        },
      };

      const razorpay = new window.Razorpay(options);
      controller.signal.addEventListener("abort", () => razorpay.close(), {
        once: true,
      });
      razorpay.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setLoading(false);
      });
      razorpay.open();
    } catch (error) {
      if (controller.signal.aborted) return;
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to start payment",
      );
      setLoading(false);
    }
  };

  const enrolled = user?.subscription?.includes(course._id);

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top_left,#e8e7ff,transparent_34%),linear-gradient(135deg,#f8fafc,#f5f3ff)] px-5 py-10 sm:px-8 sm:py-14">
      <article className="mx-auto grid max-w-6xl overflow-hidden rounded-4xl border border-white/80 bg-white shadow-[0_24px_80px_rgba(51,46,99,0.13)] lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <section className="p-5 sm:p-8 lg:p-10">
          <div className="relative overflow-hidden rounded-3xl bg-slate-200">
            <img
              src={course.imageUrl}
              alt={`${course.title} course cover`}
              className="aspect-16/10 w-full object-cover"
            />
            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-indigo-700 shadow-md">
              {course.category}
            </span>
          </div>

          <div className="mt-7">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-indigo-600">
              Course overview
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {course.description}
            </p>
          </div>

          <dl className="mt-7 grid gap-3 sm:grid-cols-2">
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
        </section>

        <aside className="flex flex-col border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-9 lg:border-l lg:border-t-0 lg:p-10">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-indigo-300">
            {enrolled ? "Already enrolled" : "Course access"}
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-black">₹{course.price}</span>
            {!enrolled && (
              <span className="pb-1 text-sm font-semibold text-slate-400">
                one-time payment
              </span>
            )}
          </div>

          <div className="mt-7 space-y-4 border-y border-white/10 py-6 text-sm font-semibold text-slate-200">
            <p className="flex items-center gap-3">
              <FiBookOpen className="shrink-0 text-indigo-300" /> Access all
              course lectures
            </p>
            <p className="flex items-center gap-3">
              <FiCheckCircle className="shrink-0 text-indigo-300" /> Track
              completed lessons
            </p>
            <p className="flex items-center gap-3">
              <FiLock className="shrink-0 text-indigo-300" /> Private, secured
              video access
            </p>
          </div>

          <div className="mt-auto pt-8">
            {enrolled ? (
              <button
                type="button"
                onClick={() => navigate(`/course/study/${course._id}`)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-400"
              >
                Continue learning <FiArrowRight />
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={checkoutHandler}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3.5 font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Checking payment…"
                    : user
                      ? "Buy this course"
                      : "Sign in to enroll"}
                  {!loading && <FiArrowRight />}
                </button>
              </div>
            )}
            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              Payment access is granted only after server verification.
            </p>
          </div>
        </aside>
      </article>
    </main>
  );
};

export default CourseDescription;
