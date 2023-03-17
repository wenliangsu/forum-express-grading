// notice 此error handler只一般通用型，實務上會分拆好幾種錯誤，看是database, server還是其他的錯誤
module.exports = {
  generalErrorHandler (err, req, res, next) {
    // note instanceof 用來檢查是否為Error的物件
    if (err instanceof Error) {
      req.flash('error_messages', `${err.name}: ${err.message}`)
    } else {
      req.flash('error_messages', `${err}`)
    }
    // note 導回前一頁，因前一頁未發生錯誤
    res.redirect('back')
    // note 把error物件再傳給下一個
    next(err)
  },
  // note 給api用的error-handler，要有狀態碼才會知道發生什麼事情
  apiErrorHandler (err, req, res, next) {
    if (err instanceof Error) {
      res.status(err.status || 500).json({
        status: 'error',
        message: `${err.name}: ${err.message}`
      })
    } else {
      res.status(500).json({
        status: 'error',
        message: `${err}`
      })
    }

    next(err)
  }
}
