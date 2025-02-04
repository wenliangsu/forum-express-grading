/* For front-end system */
const bcrypt = require('bcryptjs')
const { User, Restaurant, Comment, Favorite, Like, Followship } = require('../../models')
const { getUser } = require('../../helpers/auth-helpers')
const { imgurFileHandler } = require('../../helpers/file-helpers')
const assert = require('assert')

const userController = {
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    if (req.body.password !== req.body.passwordCheck) {
      // note 直接丟出error的物件
      throw new Error('Passwords do not match')
    }

    User.findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')

        return bcrypt.hash(req.body.password, 10)
      })
      .then(hash =>
        User.create({
          name: req.body.name,
          email: req.body.email,
          password: hash
        })
      )
      .then(() => {
        req.flash('success_messages', 'Account is signed up successfully !')
        res.redirect('/signin')
      })
      .catch(err => next(err))
    // note next()帶入err參數變成Error物件，代表使用express所給予的error處理，也可以自己寫一個
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    // note 已用passport來驗證，所以無需再多寫驗證邏輯
    req.flash('success_messages', 'Login successfully !!')
    res.redirect('/restaurants')
  },
  logout: (req, res, next) => {
    req.logout(err => {
      if (err) {
        return next(err)
      }
      req.flash('success_messages', 'Logout successfully !!')
      res.redirect('/signin')
    })
  },
  getUser: (req, res, next) => {
    const loginUser = req.user
    return Promise.all([
      User.findByPk(req.params.id, {
        //  note 關聯comment以計算使用者評論數
        include: [
          { model: Restaurant, as: 'FavoritedRestaurants' },
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' }

        ],
        nest: true
      }),
      // note 單獨使用group 會報錯，因SQL使用的mode => sql_mode=only_full_group_by有關，因此使用attribute來選取columnName，在套入group才不會報錯
      // note group的目的是把相同的名稱(or id）給他集合再一起，便不會出現重複選項
      Comment.findAll({
        where: { userId: req.params.id },
        attributes: [
          'restaurant_id'
        ],
        include: [Restaurant],
        group: 'restaurant_id',
        raw: true,
        nest: true
      })
    ])
      .then(([user, comments]) => {
        if (!user) throw new Error("User didn't exist !")

        return res.render('users/profile', { userProfile: user.toJSON(), comments, loginUser })
      })
      .catch(err => next(err))
  },
  editUser: (req, res, next) => {
    return User.findByPk(req.params.id, {
      raw: true,
      nest: true
    })
      .then(user => {
        if (!user) throw new Error("User didn't exist !")
        if (getUser(req).id !== user.id) throw new Error('You only can edit your own profile !')

        return res.render('users/edit', { user })
      })
      .catch(err => next(err))
  },
  putUser: (req, res, next) => {
    const { name } = req.body
    const currentId = req.user.id
    const userId = req.params.id
    const { file } = req

    // confirm the user's id is matched or not
    if (currentId !== Number(userId)) throw new Error("You can't alter the info of user !")
    if (!name) throw new Error('You have to input the name !')

    // notice 跑測試程式的時候，Promise前面要加return，因為測試程式不知道express的非同步已完成了沒，而繼續執行驗證作業造成出錯。，若是改用async/await，則在前面會加await，比較沒有這個問題
    return Promise.all([
      User.findByPk(userId), // note 不使用raw是因為還需要利用Sequelize的instance進行資料操作，若是轉成JS則無法使用update()
      imgurFileHandler(file)
    ])
      .then(([user, filePath]) => {
        if (!user) throw new Error("User didn't exist")

        // note return避免形成nest結構，較易閱讀，且update()也是個Promise
        return user.update({
          name,
          image: filePath || user.image
        })
      })
      .then(() => {
        req.flash('success_messages', '使用者資料編輯成功')
        res.redirect(`/users/${userId}`)
      })
      .catch(err => next(err))
  },
  addFavorite: (req, res, next) => {
    const { restaurantId } = req.params
    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Favorite.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("The restaurant didn't exist!")
        assert(!favorite, 'The restaurant is already added in your favorite')
        // if (favorite) throw new Error('The restaurant is already added in your favorite')

        return Favorite.create({ userId: req.user.id, restaurantId })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFavorite: (req, res, next) => {
    return Favorite.findOne({
      where: {
        userId: req.user.id,
        // note 在路由部分是使用自訂的動態id，所以id的使用名稱要注意
        restaurantId: req.params.restaurantId
      }
    })
      .then(favorite => {
        if (!favorite) throw new Error("You haven't added the restaurant in your favorite!")

        return favorite.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  addLike: (req, res, next) => {
    const { restaurantId } = req.params

    return Promise.all([
      Restaurant.findByPk(restaurantId),
      Like.findOne({
        where: {
          userId: req.user.id,
          restaurantId
        }
      })
    ])
      .then(([restaurant, like]) => {
        if (!restaurant) throw new Error("'The restaurant didn't exist")
        if (like) throw new Error('You already liked the restaurant!')

        return Like.create({ userId: req.user.id, restaurantId })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeLike: (req, res, next) => {
    return Like.findOne({
      where: {
        userId: req.user.id,
        restaurantId: req.params.restaurantId
      }
    })
      .then(like => {
        if (!like) throw new Error("You haven't liked the restaurant!")

        return like.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  getTopUsers: (req, res, next) => {
    return User.findAll({
      include: [{ model: User, as: 'Followers' }]
    })
      .then(users => {
        // notice 未進行raw and nest，所以在map要先每個將棋toJSON後才可剔除sequelize的操作
        const result = users.map(user => ({
          ...user.toJSON(),
          // note 計算追蹤者的人數
          followerCount: user.Followers.length,
          // note 判斷當前使用者是否已追蹤該user的物件
          isFollowed: req.user.Followings.some(f => f.id === user.id)
        })).sort((a, b) => b.followerCount - a.followerCount)
        // note 使用sort algorithm，可以看其MDN文件，若是只用血users.sort()，則會照字串排序，如[1, 11, 12, 2, 21, 3, 31]這種排法
        // note 若是a = b 則排序會依造資料庫給的順序來排序

        res.render('top-users', { users: result })
      })
      .catch(err => next(err))
  },
  addFollowing: (req, res, next) => {
    const { userId } = req.params
    Promise.all([
      User.findByPk(userId),
      Followship.findOne({
        where: {
          followerId: req.user.id,
          followingId: userId
        }
      })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error('You are already following this user!')

        return Followship.create({
          followerId: req.user.id,
          followingId: userId
        })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFollowing: (req, res, next) => {
    Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this user!")

        return followship.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}

module.exports = userController
