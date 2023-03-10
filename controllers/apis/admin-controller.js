const adminServices = require('../../services/admin-services');

const adminController = {
  // TODO  Read all restaurants
  getRestaurants: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) => err ? next(err) : res.json(data))
  }
}

module.exports = adminController
