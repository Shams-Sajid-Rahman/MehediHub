const multer = require('multer');
const path = require('path');
const fs = require('fs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function imageFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp).'));
}

function makeStorage(subDir) {
  return multer.diskStorage({
    destination(req, file, cb) {
      const dest = path.join(__dirname, '..', 'public', 'uploads', subDir);
      ensureDir(dest);
      cb(null, dest);
    },
    filename(req, file, cb) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname).toLowerCase());
    },
  });
}

const uploadNID = multer({
  storage: makeStorage('nid'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'nid_front', maxCount: 1 },
  { name: 'nid_back', maxCount: 1 },
]);

const uploadProfile = multer({
  storage: makeStorage('profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
}).single('profile_image');

const uploadPortfolio = multer({
  storage: makeStorage('portfolio'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('portfolio_image');

const uploadProduct = multer({
  storage: makeStorage('products'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('product_image');

module.exports = { uploadNID, uploadProfile, uploadPortfolio, uploadProduct };
