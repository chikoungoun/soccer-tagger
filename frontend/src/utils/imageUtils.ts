export const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) return '';

  // If already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Convert relative path to full backend URL
  return `http://localhost:8000${imagePath}`;
};