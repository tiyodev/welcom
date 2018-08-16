const request = require('request');

exports.calcAge = (birthdayDate) => {
  const now = new Date();
  let age = now - birthdayDate;
  age = Math.floor(age / 1000 / 60 / 60 / 24 / 365);
  return age;
}

exports.geocodeAddress = (address, apikey) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      url: 'https://maps.googleapis.com/maps/api/geocode/json',
      qs: {
        address,
        key: `${apikey}`,
        region: 'fr'
      },
    };
  
    request(options, (error, response, body) => {
      if (error) reject(new Error(error));
  
      const data = JSON.parse(body);
      if (data.status === 'OK') {
        let location = data.results[0].geometry.location;
        location.formatted_address = data.results[0].formatted_address;
        resolve(location);
      }
      resolve({});
    });
  });
};