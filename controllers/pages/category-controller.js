const { Category } = require('../../models')

const categoryController = {
  // notice  有兩個router用到，差別在有無id上，所以要做判別
  getCategories: (req, res, next) => {
    return Promise.all([
      Category.findAll({ raw: true }),
      // note 若參數有id則存到category 再傳給hbs
      req.params.id ? Category.findByPk(req.params.id, { raw: true }) : null
    ])
      .then(([categories, category]) => {
        res.render('admin/categories', { categories, category })
      })
      .catch(err => next(err))
  },
  postCategory: (req, res, next) => {
    const { name } = req.body
    if (!name) throw new Error('Category name is required')

    return Category.create({ name })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  },
  putCategory: (req, res, next) => {
    const { name } = req.body
    if (!name) throw new Error('Category name is required')

    return Category.findByPk(req.params.id)
      .then(category => {
        if (!category) throw new Error("Category doesn't exist")

        return category.update({ name })
      })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  },
  deleteCategory: (req, res, next) => {
    // !! 可再優化，如類別有餐廳了，刪除會連動的情況下，要如何去處理（標示未分類？ or 該類別的餐廳全刪掉)
    return Category.findByPk(req.params.id)
      .then(category => {
        if (!category) throw new Error("Category doesn't exist")

        req.flash('success_messages', 'Category is deleted successfully')

        return category.destroy()
      })
      .then(() => res.redirect('/admin/categories'))
      .catch(err => next(err))
  }
}

module.exports = categoryController
