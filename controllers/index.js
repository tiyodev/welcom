/**
 * GET /
 * Home page.
 */
exports.getIndex = (req, res, next) => {
    res.render('index', { title: 'Welcom\' Home' });
};
