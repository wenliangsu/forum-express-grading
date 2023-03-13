// Thinking: 執行驗證的時候是由config的passport驗證，非使用package的passport
const passport = require('../config/passport');

// 使用者是否驗證
// note 這邊和auth.js的一樣，但是passport的使用會是採用JWT文件的寫法。寫法較為怪異，但是如不這樣做的話，error沒法抓取
const authenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) return res.status(401).json({ status: 'error', message: 'not authenticated' });

    // !! notice passport的設計上，有傳入cb的話則是要自己去處理驗證成功的部分，因此要將驗證成功後的user自行導入req裡面
    // !! notice source code:https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js

    req.user = user;
    next();
  })(req, res, next);
}

// admin使用者與一般使用者判斷驗證邏輯
const authenticatedAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next();

  return res.status(403).json({ status: 'error', message: 'permission denied' })
}

module.exports = {
  authenticated,
  authenticatedAdmin
}
