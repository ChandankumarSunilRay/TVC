import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { server } from "../main";

const CourseContext = createContext();

export const CourseContextProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);

  async function fetchCourses() {
    try {
      const { data } = await axios.get(`${server}/api/course/all`);

      setCourses(data.courses);
    } catch (error) {
      console.error("Unable to load the public course catalog", error);
    }
  }

  async function fetchMyCourses() {
    try {
      const { data } = await axios.get(`${server}/api/mycourse`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      setMyCourses(data.courses);
    } catch (error) {
      console.error("Unable to load the learner's courses", error);
    }
  }

  useEffect(() => {
    fetchCourses();
    fetchMyCourses();
  }, []);

  const fetchMyCourse = fetchMyCourses;
  return (
    <CourseContext.Provider
      value={{
        courses,
        fetchCourses,
        myCourses,
        fetchMyCourses,
        mycourse: myCourses, // Compatibility alias for older components.
        fetchMyCourse,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const CourseData = () => useContext(CourseContext);

export function useCourse(id) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCourse() {
      try {
        const { data } = await axios.get(`${server}/api/course/${id}`, {
          signal: controller.signal,
        });
        if (data.course?._id !== id)
          throw new Error("Course details are unavailable");
        if (!controller.signal.aborted) setResult({ id, course: data.course });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            id,
            error: error.response?.data?.message || "Unable to load course",
          });
        }
      }
    }
    loadCourse();
    return () => controller.abort();
  }, [id]);

  return result?.id === id ? result : {};
}
