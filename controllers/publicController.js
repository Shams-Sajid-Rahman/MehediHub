const Artist = require('../models/Artist');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Review = require('../models/Review');
const db = require('../config/db');

const publicController = {
  async getHome(req, res, next) {
    try {
      const featuredArtists = await Artist.findAll({});
      const featuredProducts = await Product.findAll({});
      const districts = await Artist.getDistricts();

      res.render('public/home', {
        title: 'MehediHub - Find Verified Mehedi Artists in Bangladesh',
        featuredArtists: featuredArtists.slice(0, 6),
        featuredProducts: featuredProducts.slice(0, 8),
        districts,
      });
    } catch (err) { next(err); }
  },

  async getArtists(req, res, next) {
    try {
      const { district, specialization, minRating, maxRate } = req.query;
      const artists = await Artist.findAll({ district, specialization, minRating, maxRate });
      const districts = await Artist.getDistricts();

      res.render('public/artists', {
        title: 'Browse Artists - MehediHub',
        artists,
        districts,
        filters: { district, specialization, minRating, maxRate },
      });
    } catch (err) { next(err); }
  },

  async getArtistDetail(req, res, next) {
    try {
      const artist = await Artist.findById(req.params.id);
      if (!artist) { return res.redirect('/artists'); }

      const [services, products, reviews, portfolios] = await Promise.all([
        Service.findByArtistId(artist.id, true),
        Product.findByArtistId(artist.id, true),
        Review.findByTarget('artist', artist.user_id),
        db.query('SELECT * FROM portfolios WHERE artist_id = ? ORDER BY created_at DESC', [artist.id]).then(([r]) => r),
      ]);

      res.render('public/artist-detail', {
        title: `${artist.full_name} - MehediHub`,
        artist,
        services,
        products,
        reviews,
        portfolios,
        canBook: req.session.userRole === 'customer',
      });
    } catch (err) { next(err); }
  },

  async getProducts(req, res, next) {
    try {
      const { category, minPrice, maxPrice } = req.query;
      const products = await Product.findAll({ category, minPrice, maxPrice });

      res.render('public/products', {
        title: 'Browse Products - MehediHub',
        products,
        filters: { category, minPrice, maxPrice },
      });
    } catch (err) { next(err); }
  },

  async getProductDetail(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product || !product.is_active) { return res.redirect('/products'); }

      const reviews = await Review.findByTarget('product', product.id);

      res.render('public/product-detail', {
        title: `${product.name} - MehediHub`,
        product,
        reviews,
        canAddToCart: req.session.userRole === 'customer',
      });
    } catch (err) { next(err); }
  },

  getAbout(req, res) {
    res.render('public/about', { title: 'About MehediHub' });
  },
};

module.exports = publicController;
