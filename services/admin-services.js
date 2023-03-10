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
  }
}

module.exports = adminServices
