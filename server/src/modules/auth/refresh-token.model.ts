import { model, Schema, type InferSchemaType } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    /** HMAC-SHA256 of the token; the raw token only ever lives in the httpOnly cookie. */
    tokenHash: { type: String, required: true, unique: true },
    /** All tokens rotated from one sign-in share a family, so reuse can revoke the whole chain. */
    familyId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedByHash: { type: String },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true },
);

// MongoDB deletes expired tokens automatically.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDoc = InferSchemaType<typeof refreshTokenSchema>;
export const RefreshToken = model("RefreshToken", refreshTokenSchema, "refreshTokens");
