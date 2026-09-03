import "dotenv/config";
import { apiEnvSchema } from "@livegrid/config";

export const env = apiEnvSchema.parse(process.env);
