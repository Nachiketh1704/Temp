function getEnv(name: string, required = true): string {
  const value = process.env[name];
  if (!value && required) {
    throw new Error(
      `❌ Environment variable "${name}" is required but not set.`
    );
  }
  return value!;
}

export const env = {
  NODE_ENV: getEnv("NODE_ENV", false) || "development",
  PORT: parseInt(getEnv("PORT", false)) || 3000,
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN") || "7d",
  DB_URL: getEnv("DATABASE_URL"),
  SMTP_HOST: getEnv("SMTP_HOST", false),
  SMTP_PORT: parseInt(getEnv("SMTP_PORT", false)) || 587,
  SMTP_USER: getEnv("SMTP_USER", false),
  SMTP_PASS: getEnv("SMTP_PASS", false),
  DEFAULT_FROM_EMAIL: getEnv("DEFAULT_FROM_EMAIL"),
  // Add more as needed
};
