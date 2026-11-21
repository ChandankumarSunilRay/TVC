import React, { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { server } from "../../main";
import Loading from "../../components/loading/Loading";
import toast from "react-hot-toast";
import { TiTick } from "react-icons/ti";
import {
  FiArrowLeft,
  FiBookOpen,
  FiPlayCircle,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
} from "react-icons/fi";

const Lecture = ({ user }) => {
  const [lectures, setLectures] = useState([]);
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lectureLoading, setLectureLoading] = useState(false);
  const [show, setShow] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const resumeRef = useRef(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState("");
  const [videoPrev, setVideoPrev] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function fetchLectures() {
    try {
      const { data } = await axios.get(`${server}/api/lectures/${params.id}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      setLectures(data.lectures);
      setLoading(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load the curriculum",
      );
      setLoading(false);
    }
  }

  async function fetchLecture(lectureId) {
    setLectureLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/lecture/${lectureId}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      resumeRef.current = null;
      setLecture(data.lecture);
      setLectureLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load lecture");
      setLectureLoading(false);
    }
  }

  const changeVideoHandler = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setVideoPrev(URL.createObjectURL(file));
    setVideoFile(file);
  };

  const submitHandler = async (event) => {
    setIsUploading(true);
    event.preventDefault();
    const lectureForm = new FormData();

    lectureForm.append("title", title);
    lectureForm.append("description", description);
    lectureForm.append("file", videoFile);

    try {
      const { data } = await axios.post(
        `${server}/api/course/${params.id}`,
        lectureForm,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        },
      );

      toast.success(data.message);
      setIsUploading(false);
      setShow(false);
      fetchLectures();
      setTitle("");
      setDescription("");
      setVideoFile("");
      setVideoPrev("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload video");
      setIsUploading(false);
    }
  };

  const deleteHandler = async (lectureId) => {
    if (confirm("Are you sure you want to delete this lecture")) {
      try {
        const { data } = await axios.delete(
          `${server}/api/lecture/${lectureId}`,
          {
            headers: {
              token: localStorage.getItem("token"),
            },
          },
        );

        toast.success(data.message);
        if (lecture?._id === lectureId) setLecture(null);
        fetchLectures();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to delete lecture",
        );
      }
    }
  };

  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completedLectureCount, setCompletedLectureCount] = useState(0);
  const [totalLectureCount, setTotalLectureCount] = useState(0);
  const [progressRecords, setProgressRecords] = useState([]);

  async function fetchProgress() {
    try {
      const { data } = await axios.get(
        `${server}/api/user/progress?course=${params.id}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        },
      );

      setProgressPercentage(data.courseProgressPercentage);
      setCompletedLectureCount(data.completedLectures);
      setTotalLectureCount(data.allLectures);
      setProgressRecords(data.progress);
    } catch (error) {
      if (error.response?.status !== 404)
        console.error("Unable to load course progress", error);
    }
  }

  const addProgress = async (lectureId) => {
    try {
      await axios.post(
        `${server}/api/user/progress?course=${params.id}&lectureId=${lectureId}`,
        {},
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        },
      );
      fetchProgress();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to save lecture progress",
      );
    }
  };

  useEffect(() => {
    setLecture(null);
    setLoading(true);
    fetchLectures();
    fetchProgress();
  }, [params.id]);

  useEffect(
    () => () => {
      if (videoPrev) URL.revokeObjectURL(videoPrev);
    },
    [videoPrev],
  );

  useEffect(() => {
    if (!lecture?.videoUrl) return;
    let cancelled = false;
    const refreshAfter = Math.max(30, lecture.expiresIn - 180) * 1000;
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `${server}/api/lecture/${lecture._id}`,
          {
            headers: { token: localStorage.getItem("token") },
          },
        );
        if (cancelled) return;
        const player = videoRef.current;
        if (player) {
          resumeRef.current = {
            time: player.currentTime,
            wasPlaying: !player.paused,
          };
        }
        setLecture(data.lecture);
      } catch {
        if (!cancelled)
          toast.error("Unable to refresh the video. Select the lecture again.");
      }
    }, refreshAfter);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lecture?._id, lecture?.videoUrl]);

  if (
    user &&
    user.role !== "admin" &&
    !user.subscription?.includes(params.id)
  ) {
    return <Navigate to="/" replace />;
  }
  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="bg-slate-50 px-5 py-8 sm:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
                    <FiBookOpen />
                  </span>
                  <div>
                    <p className="font-black text-slate-900">
                      Course curriculum
                    </p>
                    <p className="text-sm text-slate-500">
                      {completedLectureCount} of{" "}
                      {totalLectureCount || lectures.length} lectures completed
                    </p>
                  </div>
                </div>
                <div className="flex min-w-[220px] items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{
                        width: `${Math.min(Number(progressPercentage) || 0, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-black text-slate-700">
                    {Math.round(Number(progressPercentage) || 0)}%
                  </span>
                </div>
                {user?.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin/course")}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <FiArrowLeft /> Courses dashboard
                  </button>
                )}
              </div>
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  {lectureLoading ? (
                    <Loading />
                  ) : (
                    <>
                      {lecture?.videoUrl ? (
                        <>
                          <video
                            className="aspect-video w-full rounded-2xl bg-black shadow-xl"
                            ref={videoRef}
                            src={lecture.videoUrl}
                            width={"100%"}
                            controls
                            controlsList="nodownload noremoteplayback"
                            disablePictureInPicture
                            disableRemotePlayback
                            autoPlay
                            onLoadedMetadata={(event) => {
                              const resume = resumeRef.current;
                              if (!resume) return;
                              event.currentTarget.currentTime = resume.time;
                              if (resume.wasPlaying) {
                                event.currentTarget.play().catch(() => {});
                              } else {
                                event.currentTarget.pause();
                              }
                              resumeRef.current = null;
                            }}
                            onError={() =>
                              toast.error(
                                "Unable to play video. Select the lecture again.",
                              )
                            }
                            onEnded={() => addProgress(lecture._id)}
                          ></video>
                          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.15em] text-indigo-600">
                            Now playing
                          </p>
                          <h1 className="mt-2 text-3xl font-black text-slate-950">
                            {lecture.title}
                          </h1>
                          <p className="mt-3 text-base leading-7 text-slate-600">
                            {lecture.description}
                          </p>
                        </>
                      ) : (
                        <div className="grid aspect-video place-items-center rounded-2xl bg-slate-50 p-5 text-center">
                          <div>
                            <FiPlayCircle className="mx-auto text-5xl text-slate-300" />
                            <h1 className="mt-4 text-2xl font-black text-slate-800">
                              Select a lecture
                            </h1>
                            <p className="mt-2 text-slate-500">
                              Choose a lesson from the curriculum to begin.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  {user && user.role === "admin" && (
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-extrabold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                      onClick={() => setShow(!show)}
                    >
                      <FiPlus /> {show ? "Close uploader" : "Add lecture"}
                    </button>
                  )}

                  {show && (
                    <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <h2 className="text-lg font-black text-slate-900">
                        Upload a new lecture
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        The video is stored privately in S3 and streamed with
                        temporary access.
                      </p>
                      <form
                        className="mt-4 space-y-4 text-left [&_input]:mt-1.5 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-300 [&_input]:bg-white [&_input]:p-3 [&_label]:block [&_label]:text-sm [&_label]:font-bold [&_label]:text-slate-700"
                        onSubmit={submitHandler}
                      >
                        <label>
                          Lecture title
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                          />
                        </label>

                        <label>
                          Description
                          <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                          />
                        </label>

                        <label>
                          Video file
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,video/ogg,video/x-m4v"
                            placeholder="choose video"
                            onChange={changeVideoHandler}
                            required
                          />
                        </label>

                        {videoPrev && (
                          <video
                            src={videoPrev}
                            alt=""
                            className="w-full rounded-xl"
                            controls
                          ></video>
                        )}

                        <button
                          disabled={isUploading}
                          type="submit"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-65"
                        >
                          <FiUploadCloud />{" "}
                          {isUploading ? "Uploading to S3…" : "Publish lecture"}
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="mb-3 mt-5 flex items-center justify-between">
                    <h2 className="font-black text-slate-900">Curriculum</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                      {lectures.length} lessons
                    </span>
                  </div>
                  {lectures && lectures.length > 0 ? (
                    lectures.map((lectureItem, index) => (
                      <div
                        key={lectureItem._id}
                        className={`mb-2 flex items-center gap-2 rounded-xl border p-2 transition ${lecture?._id === lectureItem._id ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <button
                          onClick={() => fetchLecture(lectureItem._id)}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left"
                        >
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-black ${lecture?._id === lectureItem._id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-bold text-slate-800">
                            {lectureItem.title}
                          </span>
                          {progressRecords[0] &&
                            progressRecords[0].completedLectures.includes(
                              lectureItem._id,
                            ) && (
                              <span className="inline-flex rounded-full bg-emerald-100 p-1 text-emerald-700">
                                <TiTick />
                              </span>
                            )}
                        </button>
                        {user && user.role === "admin" && (
                          <button
                            title={`Delete ${lectureItem.title}`}
                            aria-label={`Delete ${lectureItem.title}`}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-red-600 transition hover:bg-red-50"
                            onClick={() => deleteHandler(lectureItem._id)}
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No Lectures Yet!</p>
                  )}
                </aside>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Lecture;
