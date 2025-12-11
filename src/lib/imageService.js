/**
 * Image Service
 * Handles image compression, validation, and sizing
 */

import * as ImageManipulator from 'expo-image-manipulator';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1200;
const COMPRESSION_QUALITY = 0.7;

export const validateImageFile = (uri) => {
  if (!uri) {
    return { isValid: false, error: 'No image selected' };
  }
  return { isValid: true, error: null };
};

export const compressImage = async (uri) => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: MAX_IMAGE_WIDTH,
            height: MAX_IMAGE_HEIGHT,
          },
        },
      ],
      {
        compress: COMPRESSION_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return {
      isValid: true,
      uri: manipResult.uri,
      error: null,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    return {
      isValid: false,
      uri: null,
      error: 'Failed to compress image. Please try another image.',
    };
  }
};

export const validateAndCompressImage = async (uri) => {
  // First validate
  const validation = validateImageFile(uri);
  if (!validation.isValid) {
    return validation;
  }

  // Then compress
  return await compressImage(uri);
};

export const getImageSizeInfo = (quality = COMPRESSION_QUALITY) => {
  return {
    maxWidth: MAX_IMAGE_WIDTH,
    maxHeight: MAX_IMAGE_HEIGHT,
    maxFileSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    estimatedCompressionRatio: `${Math.round((1 - COMPRESSION_QUALITY) * 100)}% reduction`,
  };
};
