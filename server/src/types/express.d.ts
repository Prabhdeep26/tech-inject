import type { TokenPayload } from "../utils/jwt.js";
import type { UserDocument } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument | TokenPayload;
      admin?: TokenPayload;
    }
  }
}
