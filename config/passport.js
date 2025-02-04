const passport = require('passport')
const LocalStrategy = require('passport-local')
const passportJWT = require('passport-jwt')
const bcrypt = require('bcryptjs')
const { User, Restaurant } = require('../models')

const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

// set up local strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    // note cb 表示驗證完後要用於另一個callback function
    (req, email, password, cb) => {
      User.findOne({ where: { email } }).then(user => {
        if (!user) {
          return cb(
            null,
            false,
            req.flash('error_messages', 'This email is not registered!!')
          )
        }

        bcrypt.compare(password, user.password).then(res => {
          if (!res) {
            return cb(
              null,
              false,
              req.flash('error_messages', 'Email or password is incorrect !!')
            )
          }
          return cb(null, user)
        })
      })
    }
  )
)

// set up JWT strategy
// note 設定部分請看官方文件
// notice JWT不會經過序列與反序列化，要注意程式跑的方向
const jwtOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}

passport.use(new JWTStrategy(jwtOptions, (jwtPayload, cb) => {
  User.findByPk(jwtPayload.id, {
    include: [
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  })
  // note 這邊不寫user.toJSON()是因為這JWT過程解密已取得是屬於JSON格式
    .then(user => cb(null, user))
    .catch(err => cb(err))
}))

// set up the serialize and deserialize
passport.serializeUser((user, cb) => {
  cb(null, user.id)
})

passport.deserializeUser((id, cb) => {
  //  notice 在操作多對多table的時候，跟user table相關時，因會經過passport驗證並帶出資料，所以要先將反序列化部分設定一並帶出，例如favorite and like的清單
  return User.findByPk(id, {
    include: [
      //  note as:所取的名稱會對應到user model裡使用的名稱，所以要修正要同時修正model裡面的as:
      { model: Restaurant, as: 'FavoritedRestaurants' },
      { model: Restaurant, as: 'LikedRestaurants' },
      { model: User, as: 'Followers' },
      { model: User, as: 'Followings' }
    ]
  })
    .then(user => {
      // note JSON化後，可以容易透過Sequelize來操作此筆資料。若無JSON化，則會多出Sequelize的instance
      cb(null, user.toJSON())
    })
    .catch(err => cb(err))
})

module.exports = passport
