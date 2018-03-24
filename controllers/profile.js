const languages = require('../data/language');
const adjectives = require('../data/adjective');
const User = require('./../models/users');
const mongoose = require('mongoose');

const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

exports.checkProfileData = [
  check('firstName', 'The size of the first name must be between 1 and 50 characters').trim().isLength({ max: 50 }),
  check('lastName', 'The size of the last name must be between 1 and 50 characters').trim().isLength({ max: 50 }),
  check('nickName', 'Please chose a nickname (2 to 20 signs)').trim().isLength({ min: 2, max: 20 }),
  check('email', 'A valid email is needed').trim().isLength({ min: 1 }).isEmail(),
  sanitize('email').normalizeEmail(),
  check('mobileNumber', 'The mobile phone number must be supplied with the country code and therefore must start with +')
    .trim().optional({ checkFalsy: true }).isMobilePhone('any', { strictMode: true }),
  check('city', 'Please, let the community know where you live').trim().isLength({ min: 1 }),
  check('gender', 'Please let us know what pronoun we should use').trim().isIn(['Man', 'Woman']),
  check('birthdate', 'Please tell us your date of birth, it won\'t be displayed').isISO8601().isBefore(Date.now().toString()),
  sanitize('birthdate').toDate(),
  check('adjective', 'Please chose the adjective that best describes you').trim().isLength({ min: 1 }),
  check('languageSpoken', 'Please tell us your spoken languages').trim().isLength({ min: 1 }),
  check('languageLearning').trim().optional({ checkFalsy: true }),
  check('hobbies', 'Please chose at least one hobby').trim().isLength({ min: 1 }),
  check('inputIntro', 'Please, tell us a little bit about you (30 signs min)').trim().isLength({ min: 30, max: 200 }),
  check('inputBio', 'Please, tell us a little bit about your life (100 signs min)').trim().isLength({ min: 100, max: 2000 }),
  check('inputSharing', 'Please, write something about what you would like to share (30 signs min)').trim().isLength({ min: 30, max: 600 }),
  check('inputTripLived', 'Between 20 and 300 characters').trim().optional({ checkFalsy: true }).isLength({ min: 20, max: 300 }),
  check('inputFutureTravel', 'Between 20 and 300 characters').trim().optional({ checkFalsy: true }).isLength({ min: 20, max: 300 }),
  check('facebookLink', 'Please let us a valid URL').trim().optional({ checkFalsy: true }).isURL({
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: false,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false
  }),
  check('instagramLink', 'Please let us a valid URL').trim().optional({ checkFalsy: true }).isURL({
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: false,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false
  }),
  check('twitterLink', 'Please let us a valid URL').trim().optional({ checkFalsy: true }).isURL({
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: false,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false
  }),
  check('otherLink', 'Please let us a valid URL').trim().optional({ checkFalsy: true }).isURL({
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: false,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false
  })
];

/**
 * GET /
 * Profile Page
 */
exports.getProfile = (req, res) => {
  const data = {
    profileHeaderPic: '/images/photo-paris10.jpg',
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    nbRecommendation: 2,
    description: 'A cool years old traveller from Copenhagen, Denmark.',
    languageSpokenDesc: 'He speaks Danish and English, and he learns Spanish.',
    shortDesc: 'So this is a small text to introduce the traveller, a hook, a short laius.</br>Two or three lines should be enough, it\'s just to day a quick </br> "hello, here\'s why you should meet me"',
    shareCommunityDesc: 'I\'m ready to share my cooking skills, love of travels, and debate competittrisation like MOF',
    aboutMe: ` This should be a longer text, from 400 up to 2000 characters, describing in extenso the traveller
      and what he/she wants to say. This should be a longer text, from 400 up to 2000 characters,
      describing in extenso the traveller and what he/she wants to say.</br></br>&nbsp;&nbsp;
      
      This should be a longer text, from 400 up to 2000 characters, describing in extenso the traveller
      and what he/she wants to say. This should be a longer text, from 400 up to 2000 characters,
      describing in extenso the traveller and what he/she wants to say. . This should be a longer text,
      from 400 up to 2000 characters, describing in extenso the traveller and what he/she wants to say..</br></br>
    
      it should include some text management tool if possible`,
    tripLived: 'I\'ve been to India (Kerala and Bengalore), to France, mostly Paris and Nice, and i Know my country pretty well too.',
    travelPlans: 'I plan to go a few weeks to Costa Rica, and to the Baltic Countries, but I will go wherever there is cool travelers to meet!',
    tags: ['Pizza', 'Ile de la cité', 'Fine wine', 'History', 'Architecture', 'Dis camion', 'Etc Etc Etc Etc Etc', 'Dis camion', 'Blop', 'Neighborhood'],
    facebookLink: 'https://www.facebook.com/',
    instagramLink: 'https://www.instagram.com',
    twitterLink: 'https://twitter.com/',
    webLink: 'https://www.twitch.tv',
    isConnectedUser: true
  };

  res.render('profile/profile', { title: 'Profile', data });
};

/**
 * GET /
 * Edit Profile Page
 */
exports.getEditProfile = (req, res) => {
  res.render('profile/edit-profile', { title: 'Edit Profile', languages, adjectives, user: req.user });
};

/**
 * POST /
 * Edit Profile Page
 */
exports.postEditProfile = (req, res) => {
  console.log(`data recup: ${JSON.stringify(req.body)}`);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(`errors 1:${JSON.stringify(errors)}`);

    return res.render('profile/edit-profile', {
      title: 'Edit Profile',
      languages,
      adjectives,
      user: req.user,
      errors: errors.mapped()
    });
  }

  res.redirect('/profile');
};

/**
 * GET /
 * Profile Page / Recommendations
 */
exports.getRecommendation = (req, res) => {
  const data = {
    profileHeaderPic: '/images/photo-paris10.jpg',
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    recommendationDescription: 'Really happy that the travellers I meet from all over the world like my experiences that much! It\'s perfect.',
    nbRecommendation: 2,
    description: 'A cool years old traveller from Copenhagen, Denmark.',
    languageSpokenDesc: 'He speaks Danish and English, and he learns Spanish.',
    isConnectedUser: false
  };

  const recommendations = [];

  // [{
  //   profilePic: '/images/sampleProfilePic1.png',
  //   displayName: 'Sam Gamji',
  //   city: 'Detroit',
  //   country: 'USA',
  //   titleExperience: 'My First experience',
  //   receiverDisplayName: '',
  //   comment: 'User is really cool person, and smells good! An amazing time
  // together for fucks sakes!',
  //  },
  //  {
  //   profilePic: '/images/sampleProfilePic2.png',
  //   displayName: 'Xiu Lui',
  //   city: 'Taipei',
  //   country: 'Taiwan',
  //   titleExperience: '',
  //   receiverDisplayName: 'Thomasson',
  //   comment: 'User is really cool person, and smells good! An amazing time
  // together for fucks sakes! zadazd azd azd azdaz treg sdg sdg rtheth rtze r
  // qfdf xcvdfvd gzerg zt e rfd xdgf dgerre zr se sfsdgdfg erg ertg zr e fsdf
  //  sdf tztzert zf zadazd azd azd azdaz treg sdg sdg rtheth rtze r qfdf
  // xcvdfvd gzerg zt e rfd xdgf dgerre zr se sfsdgdfg erg ertg zr e fsdf sdf
  // tztzert zf',
  //   anwser: {
  //     profilePic: '/images/default-profile-pic.jpg',
  //     displayName: 'Thomasson',
  //     comment: 'A pleasure amiga! We were realy lucky with the weather.
  // fsdf sdf ez gsf dsfsd fqfqae fzeg sdfsdf srf erhdgfsdrfze hersef sf
  // seqf e z gsdgsdf s ez ztzet sdfsdfg rgreteze z fdfs '
  //   }
  //  }];

  res.render('profile/recommendation', { title: 'Recommendations', data, recommendations });
};

/**
 * GET /
 * Profile Page / Experiences
 */
exports.getExperience = (req, res) => {
  const data = {
    profileHeaderPic: '/images/photo-paris10.jpg',
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    nbWelcomerRecommendations: 2,
    experiencesDesc: `I'm so proud to be a welcomer ! So much to do in my city, 
      but I prefer is to do that and that and this with beers and flowers.`
  };

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

  // const exps = [];

  res.render('profile/experience', { title: 'Experiences', data, exps });
};

/**
 * GET /
 * Profile Page / Dashboard
 */
exports.getDashboard = (req, res) => {
  const data = {
    profileHeaderPic: '/images/photo-paris10.jpg',
    profilePic: '/images/default-profile-pic.jpg',
    displayName: 'Thomasson',
    nbRecommendation: 2,
    isWelcomer: true,
  };

  const exps = {
    asTraveler1: {

    },
    asTraveler: {
      pending: [{
        welcomerProfilePic: '/images/sampleProfilePic1.png',
        title: 'Title to the experience which can be very long + link ti the exp... f zef ze fozef zeoifj zeoijf oziej fozef ',
        welcomerDisplayName: 'Yohann',
        date: new Date(Date.now()),
        nbTravellers: 2,
        expCover: '/images/expImg2.jpg'
      }],
      come: [{
        welcomerProfilePic: '/images/sampleProfilePic2.png',
        title: 'Title to the experience which can be very long + link ti the exp...',
        welcomerDisplayName: 'JB',
        date: new Date(Date.now()),
        nbTravellers: 5,
        expCover: '/images/expImg3.jpg'
      }],
      past: [{
        welcomerProfilePic: '/images/sampleProfilePic2.png',
        title: 'Title to the experience which can be very long + link ti the exp...',
        welcomerDisplayName: 'Thomasson',
        date: new Date(Date.now()),
        nbTravellers: 1,
        expCover: '/images/expImg1.jpg'
      }]
    },
    asWelcomer1: {

    },
    asWelcomer: {
      pending: [{
        travelerProfilePic: '/images/sampleProfilePic2.png',
        title: 'Title to the experience which can be very long + link ti the exp...',
        travelerDisplayName: 'Yohann',
        date: new Date(Date.now()),
        nbTravellers: 2,
        expCover: '/images/expImg1.jpg',
        travelerMsg: '[Message the traveller wrote] Hello! We are from Bishek and we would love to see Paris with you you you you you you you youyou you you youyou you you youyou you you youyou you you youyou you you you'
      }],
      come: [{
        travelerProfilePic: '/images/sampleProfilePic1.png',
        title: 'Title to the experience which can be very long + link ti the exp...',
        travelerDisplayName: 'JB',
        date: new Date(Date.now()),
        nbTravellers: 5,
        expCover: '/images/expImg2.jpg'
      }],
      past: [{
        travelerProfilePic: '/images/sampleProfilePic2.png',
        title: 'Title to the experience which can be very long + link ti the exp...',
        travelerDisplayName: 'Thomasson',
        date: new Date(Date.now()),
        nbTravellers: 1,
        expCover: '/images/expImg3.jpg'
      }]
    }
  };

  res.render('profile/dashboard', { title: 'Dashboard', data, exps });
};
