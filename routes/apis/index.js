const express = require('express');
const router = express.Router();
const passport = require('../../config/passport')

const admin = require('./modules/admin');

const restController = require('../../controllers/apis/restaurant-controller');
const userController = require('../../controllers/apis/user-controller')
const { apiErrorHandler } = require('../../middleware/error-handle')

router.use('/admin', admin);

// note 因api使用JWT驗證機制，session需要先設定為false(不產生session id)
router.post('/signin', passport.authenticate('local', { session: false }), userController.signIn)

router.get('/restaurants', restController.getRestaurants);

router.use('/', apiErrorHandler)

module.exports = router;
