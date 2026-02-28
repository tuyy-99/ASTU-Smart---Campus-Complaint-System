const fs = require('fs');
const pdfParse = require('pdf-parse');

const MAX_EXTRACTED_CHARS = 12000;

const sanitizeText = (text) => {
  if (!text) {
    return '';
  }

  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_EXTRACTED_CHARS);
};

exports.extractFileText = async (file) => {
  if (!file || !file.path) {
    return null;
  }

  if (file.mimetype !== 'application/pdf') {
    return null;
  }

  try {
    const buffer = fs.readFileSync(file.path);
    const parsed = await pdfParse(buffer);
    const text = sanitizeText(parsed.text);
    return text || null;
  } catch (error) {
    return null;
  }
};
