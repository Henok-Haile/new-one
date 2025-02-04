import jwt from 'jsonwebtoken';
// const jwt = require("jsonwebtoken");

const isEmailVerified = async (request, response, next) => {
  let token;

  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = request.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      request.user = await User.findById(decoded.userId).select("-password");

      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return response.status(401).json({
        message: "Token verification failed. Invalid or expired token.",
      });
    }
  } else {
    return response.status(401).json({
      message: "Not authorized, no token",
    });
  }
};
// module.exports = {
//   isEmailVerified,
// };

export default isEmailVerified;
