/* For front-end system */
// notice controller負責處理流程控制、接收資料來源與整理回傳結果

const { Restaurant, Category, Comment, User, Favorite } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    // notice 有關兩個以上table的關聯查詢使用上，用include來結合，include: { model: XXX, as: 'abc'} => 關聯XXX的table並以abc的名字作為別名，所以console後會出現abc來取代物件XXX的名字，若沒有as設定別名的話，則會以XXXs作為名稱來操作(可以關聯同一個table但是取不同的別名)
    return Restaurant.findByPk(req.params.id, {
      nest: true,
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ],
      // note 使comment按照時間排序 order: [tableNAme, 'filedName', 'DESC or ASC]
      order: [
        [Comment, 'createdAt', 'DESC']
      ]
    })
      .then(restaurant => {
        console.log(restaurant.toJSON())
        // notice 建議console出來以了解output格式的變化
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        // note 導入瀏覽增加次數
        return restaurant.increment('viewCounts', { by: 1 })
      })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)

        const isLiked = restaurant.LikedUsers.some(f => f.id === req.user.id)

        // note 因要操作資料庫，所以不使用raw來進行，所以導入變數的時候要先進行純JS的格式化
        return res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    const restaurantId = req.params.id

    // notice 使用raw時，會把comments的整體內容與長度都被清理掉，因此要傳遞length的話則需要用到sequelize操作
    return Promise.all([
      Restaurant.findByPk(restaurantId, {
        nest: true,
        include: [
          Category,
          { model: Comment }
        ]
      }),
      // Thinking Favorite在model裡面並未設定對Restaurant以及user的關聯性，因此要採用include的做法，必須要像Comment一樣在model裡面設定關聯性，才有辦法套用到。
      Favorite.findAndCountAll({
        where: { restaurantId },
        raw: true,
        nest: true
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist!")

        return res.render('dashboard', { restaurant: restaurant.toJSON(), favorite })
      })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            // note 移除敏感資料
            attributes: { exclude: ['password'] }
          },
          Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        console.log(comments)
        res.render('feeds', { restaurants, comments })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        const modifiedRestaurants = restaurants.map(rest => ({
          ...rest.toJSON(),
          favoritedCount: rest.FavoritedUsers.length,
          isFavorited: req.user?.FavoritedRestaurants.some(f => f.id === rest.id) || []
        }))
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, 10)

        res.render('top-restaurants', { restaurants: modifiedRestaurants })
      })
      .catch(err => next(err))
  }
}

module.exports = restaurantController
