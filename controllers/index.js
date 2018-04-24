/**
 * GET /
 * Home page.
 */
exports.getIndex = (req, res) => {
  const exps = [{
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson-Thomasson-Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together Explore the wonderful Golden',
    isFree: true
  },
  {
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 0,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together',
    isFree: false
  },
  {
    headerPic: '/images/default-img-card.jpg',
    nbRecommendation: 5,
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    expDesc: 'Explore the wonderful Golden Triangle together',
    isFree: false
  }];

  res.render('index', { title: 'Welcom\' Home', exps });
};
