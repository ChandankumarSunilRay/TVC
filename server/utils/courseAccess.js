export function canWatchCourse(user, courseId) {
  if (!user || !courseId) return false;
  if (user.role === "admin") return true;

  return (
    Array.isArray(user.subscription) &&
    user.subscription.some((id) => id?.toString() === courseId.toString())
  );
}
