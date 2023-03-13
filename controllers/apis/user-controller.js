const jwt = require('jsonwebtoken')

const userController = {
  signIn: (req, res, next) => {
    try {
      // notice 先前用local驗證時session會經過serializeUser以及deserializeUser,此時資料會先轉為JSON，但是因現在不使用session，所以資料並未經過該程序後轉變JSON化，因此要先幫資料做整理轉換
      const userData = req.user.toJSON()
      delete userData.password // note 移除敏感資料
      console.log(userData)

      // note jwt.sign第一個參數為playload, 即為攜帶的資料
      const token = jwt.sign(userData, process.env.JWT_SECRET, {
        //  note JWT驗證效期為30days
        expiresIn: '30d'
      })

      res.json({
        status: 'success',
        // note 把token放到資料且加入發出requrest的user資料，一並發送給前端去運用
        data: {
          token,
          user: userData
        }
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = userController
