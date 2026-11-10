import multer from "multer";
import { HttpError } from "../../utils/http-error.js";
 
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }).single("file");
 
export function uploadFile(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      return next(new HttpError(400, err.code === "LIMIT_FILE_SIZE" ? "File is bigger than 5 MB" : "Upload failed"));
    }
    if (!req.file) return next(new HttpError(400, "Choose a file"));
    if (!/\.csv$/i.test(req.file.originalname)) {
      return next(new HttpError(400, "Use the .csv file exported from the cheatproof system"));
    }
    next();
  });
}
