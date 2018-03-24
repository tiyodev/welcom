/**
 * GET /
 * Home page.
 */
exports.getIndex = (req, res) => {
  const exps = [{
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together'
  },
  {
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together'
  },
  {
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together'
  }];

  res.render('index', { title: 'Welcom\' Home', exps });
};
