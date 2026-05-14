const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/', publicController.getHome);
router.get('/artists', publicController.getArtists);
router.get('/artists/:id', publicController.getArtistDetail);
router.get('/products', publicController.getProducts);
router.get('/products/:id', publicController.getProductDetail);
router.get('/about', publicController.getAbout);

module.exports = router;
