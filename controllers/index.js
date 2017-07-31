/**
 * GET /
 * Home page.
 */
exports.getIndex = (req, res) => {
  res.render('index', { title: 'Welcom\' Home' });
};
