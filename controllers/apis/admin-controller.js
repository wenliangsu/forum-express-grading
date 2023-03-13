/* For front-end system, send the data to them after treatment */
const adminServices = require('../../services/admin-services');

const adminController = {
  getRestaurants: (req, res, next) => {
    adminServices.getRestaurants(req, (err, data) => err
      ? next(err)
      // note 設定請求成功的狀態，若不設定狀態的話，前端拿到空資料且沒反應會覺得很怪。
      : res.json({ status: 'success', data }))
  },
  postRestaurant: (req, res, next) => {
    adminServices.postRestaurant(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  },
  deleteRestaurant: (req, res, next) => {
    adminServices.deleteRestaurant(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }

}

module.exports = adminController
