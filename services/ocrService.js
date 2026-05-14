const Tesseract = require('tesseract.js');

function extractNIDNumber(text) {
  const match = text.match(/\b(\d{17}|\d{13}|\d{10})\b/);
  return match ? match[1] : '';
}

function extractName(text) {
  const patterns = [
    /(?:Name|নাম)\s*[:\s]\s*([A-Za-zঀ-৿ ]+)/i,
    /(?:Name|নাম)\s*[:\s]+(.+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().split('\n')[0].trim();
  }
  return '';
}

function extractDOB(text) {
  const patterns = [
    /(?:Date of Birth|জন্ম তারিখ|DOB)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
    /(?:Date of Birth|জন্ম তারিখ|DOB)[:\s]+(\d{1,2}\s+\w+\s+\d{4})/i,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i,
    /\b(\d{2}[/-]\d{2}[/-]\d{4})\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return '';
}

function extractFatherName(text) {
  const patterns = [
    /(?:Father|পিতা)\s*[:\s]+([A-Za-zঀ-৿ ]+)/i,
    /Father['s]*\s*Name\s*[:\s]+([A-Za-zঀ-৿ ]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().split('\n')[0].trim();
  }
  return '';
}

function extractMotherName(text) {
  const patterns = [
    /(?:Mother|মাতা)\s*[:\s]+([A-Za-zঀ-৿ ]+)/i,
    /Mother['s]*\s*Name\s*[:\s]+([A-Za-zঀ-৿ ]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().split('\n')[0].trim();
  }
  return '';
}

function extractAddress(text) {
  const patterns = [
    /(?:Address|ঠিকানা)\s*[:\s]+(.+?)(?:\n\n|$)/is,
    /(?:Address|ঠিকানা)\s*[:\s]+([^\n]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].replace(/\n/g, ', ').trim().substring(0, 500);
  }
  return '';
}

async function runOCR(imagePath) {
  // tesseract.js v5+ uses createWorker API; v7 still supports recognize() directly
  try {
    const result = await Tesseract.recognize(imagePath, 'eng');
    return result.data.text;
  } catch (err) {
    // fallback: try createWorker API for v5+
    try {
      const worker = await Tesseract.createWorker('eng');
      const { data: { text } } = await worker.recognize(imagePath);
      await worker.terminate();
      return text;
    } catch (err2) {
      throw new Error('OCR failed: ' + err2.message);
    }
  }
}

async function extractNIDData(frontPath, backPath) {
  try {
    const rawFront = await runOCR(frontPath);
    let rawText = rawFront;

    if (backPath) {
      try {
        const rawBack = await runOCR(backPath);
        rawText += '\n---BACK---\n' + rawBack;
      } catch {
        rawText += '\n---BACK (error)---\n';
      }
    }

    return {
      rawText,
      nidNumber: extractNIDNumber(rawText),
      name: extractName(rawText),
      dateOfBirth: extractDOB(rawText),
      fatherName: extractFatherName(rawText),
      motherName: extractMotherName(rawText),
      address: extractAddress(rawText),
    };
  } catch (err) {
    throw new Error('OCR processing failed: ' + err.message);
  }
}

module.exports = { extractNIDData };
