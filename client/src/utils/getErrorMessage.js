export function getErrorMessage(error) {
  const data = error?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return first;
  }
  return data?.message || "Something went wrong. Please try again.";
}
