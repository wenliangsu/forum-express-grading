/* for api of restaurant-controller */

//  notice  已拆解為api模式，此處為負責商業邏輯運算，日後維護較易

const { Restaurant, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const restaurantServices = {
  getRestaurants: (req, cb) => {
    // note 避免有magic number(意指找不到為何定義的數字)，所以都要另外做個變數讓別人知道這個數字的意義為何，像是limit and substring
    const SUBSTRING_END = 50
    const DEFAULT_LIMIT = 9
    const categoryId = Number(req.query.categoryId) || ''
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    const offset = getOffset(limit, page)

    // Thinking 使用where時，因前面有ifCond做條件判斷，所以用三元運算子來進行，而多加個spread operator則是若傳進來的為物件，則可以個別使用。
    Promise.all([
      Restaurant.findAndCountAll({
        raw: true,
        nest: true,
        include: [Category],
        where: {
          // notice where這個做法可以在後面多加好幾個條件，以便於未來擴充查詢條件。spread operator優先級較低，會先執行三元運算子後再執行spread operator
          ...categoryId ? { categoryId } : {}
        },
        limit, // note 限制顯示的個數
        offset
      }),
      Category.findAll({ raw: true })
    ])
      .then(([restaurants, categories]) => {
        // Thinking 要帶入與user table相關聯的資料，需要先到passport的反序列做修正，因使用者資料都會先經過passport驗證並序列化。

        // Thinking 因經過api路徑，因此不需要驗證後才取得資料，故req.user會變成一個undefined, 需要做條件判斷

        const favoritedRestaurantsIds = req.user?.FavoritedRestaurants.map(fr => fr.id) ?? []

        const likedRestaurantsIds = req.user?.LikedRestaurants.map(fr => fr.id) || []

        // notice 使用findAndCountAll 會產生count以及物件被rows包住，所以後面使用要變成restaurants.count and restaurants.rows
        const data = restaurants.rows.map(r => ({
          // note spread operator可以把重複的項目以後面的為基準取代前面的，所以description變成所要的50個字以內
          ...r,
          description: r.description.substring(0, SUBSTRING_END),
          isFavorited: favoritedRestaurantsIds.includes(r.id),
          isLiked: likedRestaurantsIds.includes(r.id)
        }))

        // note 使用cb會需要以err當作第一參數
        return cb(null, {
          restaurants: data,
          categories,
          categoryId,
          pagination: getPagination(limit, page, restaurants.count)
        })
      })
      .catch(err => cb(err))
  }
}

module.exports = restaurantServices
