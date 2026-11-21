const TryCatch = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      if (error?.name === "ValidationError" || error?.name === "CastError") {
        return res
          .status(400)
          .json({ message: "Check the submitted fields and try again." });
      }
      console.error("Request failed", req.method, req.route?.path, error?.name);
      res
        .status(500)
        .json({
          message:
            "The server could not complete this request. Please try again.",
        });
    }
  };
};

export default TryCatch;
