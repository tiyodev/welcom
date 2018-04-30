const Interest = require('./../models/interests');

/**
 * GET /
 * Get tags
 */
exports.getTags = (req, res) => {
  Interest.find({ name: { $regex: req.query.term, $options: 'i' } }, (err, tags) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).jsonp(tags);
  });
};
