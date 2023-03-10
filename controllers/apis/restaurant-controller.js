/* For front-end system */
// notice controller負責處理流程控制、接收資料來源與整理回傳結果
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    // note err處為callback func
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.json(data))
  }
}

module.exports = restaurantController
