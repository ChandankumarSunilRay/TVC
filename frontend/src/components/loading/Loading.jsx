const Loading = () => {
  return (
    <div
      className="flex h-[80vh] items-center justify-center bg-[#f7f8fc]"
      role="status"
      aria-label="Loading"
    >
      <div className="h-[50px] w-[50px] animate-spin rounded-full border-[5px] border-[#e9e7f4] border-t-[#6d4aff]"></div>
    </div>
  );
};

export default Loading;
