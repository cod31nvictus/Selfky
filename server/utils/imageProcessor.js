const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Resize and optimize image to reduce file size
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save resized image
 * @param {Object} options - Resize options
 * @returns {Promise<Object>} - Result with file size info
 */
const resizeImage = async (inputPath, outputPath, options = {}) => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    // Get original image info
    const originalInfo = await sharp(inputPath).metadata();
    
    // Calculate new dimensions maintaining aspect ratio
    let { width, height } = originalInfo;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Resize and optimize image
    const processedImage = sharp(inputPath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality });

    // Save the processed image
    await processedImage.toFile(outputPath);

    // Get file size info
    const originalSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    const compressionRatio = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    return {
      success: true,
      originalSize,
      newSize,
      compressionRatio: `${compressionRatio}%`,
      dimensions: { width, height },
      format: 'jpeg'
    };
  } catch (error) {
    console.error('Image processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Process uploaded image file
 * @param {Object} file - Uploaded file object
 * @param {string} uploadDir - Directory to save processed image
 * @param {string} filename - Output filename
 * @returns {Promise<Object>} - Processing result
 */
const processUploadedImage = async (file, uploadDir, filename) => {
  try {
    // Create temporary path for original file
    const tempPath = path.join(uploadDir, `temp_${filename}`);
    
    // Save original file temporarily
    await file.mv(tempPath);
    
    // Process the image
    const outputPath = path.join(uploadDir, filename);
    const result = await resizeImage(tempPath, outputPath, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 80
    });
    
    // Clean up temporary file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    if (result.success) {
      return {
        success: true,
        filename,
        originalSize: result.originalSize,
        newSize: result.newSize,
        compressionRatio: result.compressionRatio,
        dimensions: result.dimensions
      };
    } else {
      // If processing fails, use original file
      if (fs.existsSync(tempPath)) {
        fs.renameSync(tempPath, outputPath);
      }
      return {
        success: false,
        filename,
        error: result.error,
        fallback: true
      };
    }
  } catch (error) {
    console.error('File processing error:', error);
    return {
      success: false,
      filename,
      error: error.message
    };
  }
};

module.exports = {
  resizeImage,
  processUploadedImage
}; 