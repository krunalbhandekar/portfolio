import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

// Parse CLOUDINARY_URL explicitly (the SDK also reads it from process.env) so we can expose
// the cloud name / API key for signed uploads. The API secret never leaves the server.
const { username: apiKey, password: apiSecret, hostname: cloudName } = new URL(env.CLOUDINARY_URL);

cloudinary.config({
  cloud_name: cloudName,
  api_key: decodeURIComponent(apiKey),
  api_secret: decodeURIComponent(apiSecret),
  secure: true,
});

export const cloudinaryConfig = {
  cloudName,
  apiKey: decodeURIComponent(apiKey),
  apiSecret: decodeURIComponent(apiSecret),
};

export { cloudinary };
