import crypto from "crypto";

export default function generateImportId(fileBuffer: Buffer) {
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}
