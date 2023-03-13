/* For front-end system, send the data to them after treatment */
// notice controller負責處理流程控制、接收資料來源與整理回傳結果
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    // note err處為callback func
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }
}

module.exports = restaurantController
