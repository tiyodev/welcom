const tagsController = require('./../controllers/tags');

module.exports = function(app) {
  app.get('/tags/autocomplete', tagsController.getTags);
}