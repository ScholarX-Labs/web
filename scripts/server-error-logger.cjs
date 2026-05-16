const formatError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      cause:
        error.cause instanceof Error
          ? {
              name: error.cause.name,
              message: error.cause.message,
              stack: error.cause.stack,
            }
          : error.cause,
    };
  }

  return { value: error };
};

process.on("uncaughtException", (error) => {
  console.error("[node:uncaughtException]", formatError(error));
});

process.on("unhandledRejection", (reason) => {
  console.error("[node:unhandledRejection]", formatError(reason));
});

console.info("[server-error-logger] installed");
