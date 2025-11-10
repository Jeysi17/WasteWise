export const handleError = (res, message, error, code = 500) => {
    console.error(`${message}:`, error);
    res.status(code).json({ error: message });
  };
  