import dotenv from "dotenv";
dotenv.config();

try {
  dotenv.config();
} catch (error) {
  console.error("Error loading environment variables:", error);
  process.exit(1);
}
export const PORT = process.env.PORT || 9000;

export const TEST_MODE = true;

export const OPENAPI_UNISAT_URL = TEST_MODE
  ? "https://open-api-testnet.unisat.io"
  : "https://open-api.unisat.io";

export const OPENAPI_UNISAT_TOKEN = process.env.UNISAT_TOKEN;