/* for api of admin-controller */

const { Restaurant, Category } = require('../models');

const adminServices = {
  // TODO  Read all restaurants
  getRestaurants: (req, cb) => {
    //  note raw 是讓資料呈現簡化為單純的JS物件，若是不加的話，則會是原生Sequelize的instance，除非需要對後續取得的資料操作，才不加。
    // note nest 因取用兩個model，所以未加入的話則會變成restaurant[X]['Category.name'], 加入後可以變成restaurant[X].Category.name，較方便操作
    Restaurant.findAll({
      raw: true,
      nest: true,
      // note 帶入另一個model進行關聯查詢，在sequelize此為eager loading
      include: [Category]
    })
      .then(restaurants => {
        return cb(null, { restaurants });
      })
      .catch(err => cb(err));
  },
  // TODO Delete the restaurant data
  deleteRestaurant: (req, cb) => {
    return Restaurant.findByPk(req.params.id)
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist !!");

        return restaurant.destroy();
      })
      // note 雖然刪除資料可以不給，但是預留資料給前端去設計使用體驗
      .then(deleteRestaurant => cb(null, { restaurant: deleteRestaurant }))
      .catch(err => cb(err));
  }
}

module.exports = adminServices
