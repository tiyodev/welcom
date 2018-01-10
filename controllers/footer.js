/**
 * GET /termsOfUse
 * Footer page : Terms of use.
 */
exports.getTermsOfUse = (req, res) => {
  res.render('footer/terms-of-use', { title: 'Terms of use' });
};

exports.getWelcomTeam = (req, res) => {
  res.render('footer/welcom-team', { title: 'Meet the team' });
};

exports.getContactUs = (req, res) => {
  res.render('footer/contact-us', { title: 'Contact Us' });
};

exports.getNeedYou = (req, res) => {
  res.render('footer/need-you', { title: 'We need you' });
};

exports.getReadBlog = (req, res) => {
  res.render('footer/read-your-blog', { title: 'Read your blog' });
};

exports.getLearnMore = (req, res) => {
  res.render('footer/learn-more', { title: 'Learn more' });
};
