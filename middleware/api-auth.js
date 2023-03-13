// Thinking: 執行驗證的時候是由config的passport驗證，非使用package的passport
const passport = require('../config/passport');

// 使用者是否驗證
// note 這邊和auth.js的一樣，但是passport的使用會是採用JWT文件的寫法
const authenticated = passport.authenticate('jwt', { session: false })

// admin使用者與一般使用者判斷驗證邏輯
const authenticatedAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next();

  return res.status(403).json({ status: 'error', message: 'permission denied' })
}

module.exports = {
  authenticated,
  authenticatedAdmin
}
