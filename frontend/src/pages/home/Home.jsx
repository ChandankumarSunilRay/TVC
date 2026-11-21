import React from "react";
import { Link } from "react-router-dom";
import { FiBookOpen, FiClock, FiCheckCircle } from "react-icons/fi";
import { CourseData } from "../../context/CourseContext";
import { UserData } from "../../context/UserContext";
import "./home.css";

const coursePrice = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const Home = () => {
  const { courses } = CourseData();
  const { user, isAuth } = UserData();
  const featuredCourses = courses.slice(0, 3);

  return (
    <div className="campus-home">
      <section className="home-container" aria-labelledby="home-title">
        <div className="home-intro">
          <div className="home-intro-copy">
            <p className="home-eyebrow">Welcome to The Virtual Campus</p>
            <h1 id="home-title">Learning, at <em>your own pace.</em></h1>
            <p className="home-summary">
              Video courses to fit around your day, with completed lessons
              saved as you go.
            </p>
            <div className="home-actions">
              <Link className="home-button" to="/courses">Explore courses</Link>
              <Link className="home-text-link" to={isAuth ? "/account" : "/register"}>
                {isAuth ? "My account" : "Create an account"}
              </Link>
            </div>
          </div>
          <figure className="home-study-photo">
            <img
              src="/study-session.jpg"
              alt="Two people working together on a laptop"
              width="1100"
              height="733"
              fetchPriority="high"
            />
            <figcaption>A little time. Something new to learn.</figcaption>
          </figure>
        </div>
        <ul className="home-details" aria-label="Learning features">
          <li><FiBookOpen aria-hidden="true" /> Video-based courses</li>
          <li><FiClock aria-hidden="true" /> No fixed timetable</li>
          <li><FiCheckCircle aria-hidden="true" /> Track completed lessons</li>
        </ul>
      </section>

      <section className="home-catalog" aria-labelledby="home-courses-title">
        <div className="home-container">
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">The course library</p>
              <h2 id="home-courses-title">What will you learn next?</h2>
            </div>
            <Link className="home-text-link" to="/courses">View all courses</Link>
          </div>

          {featuredCourses.length > 0 ? (
            <div className="home-course-grid">
              {featuredCourses.map((course) => {
                const enrolled = isAuth && user?.subscription?.includes(course._id);
                const canStudy = enrolled || (isAuth && user?.role === "admin");
                const destination = canStudy
                  ? "/course/study/" + course._id
                  : "/course/" + course._id;

                return (
                  <article className="home-course" key={course._id}>
                    <Link className="home-course-cover" to={destination} tabIndex={-1} aria-hidden="true">
                      <img src={course.imageUrl} alt="" loading="lazy" />
                    </Link>
                    <div className="home-course-content">
                      <div className="home-course-meta">
                        <span>{course.category}</span>
                        <span>{course.duration} weeks</span>
                      </div>
                      <h3><Link to={destination}>{course.title}</Link></h3>
                      <p className="home-course-teacher">By {course.createdBy}</p>
                    </div>
                    <div className="home-course-bottom">
                      <span className="home-course-price">{coursePrice.format(course.price)}</span>
                      <Link className="home-course-action" to={destination} aria-label={(canStudy ? "Continue " : "View ") + course.title}>
                        {canStudy ? "Continue learning" : "View course"}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="home-empty">
              <h3>No courses to show yet.</h3>
              <p>Check back here for available courses.</p>
              <Link className="home-text-link" to="/courses">Open the course catalog</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
