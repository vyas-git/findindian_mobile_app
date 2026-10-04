const appJson = require('./app.json');

module.exports = () => {
  const variant = process.env.APP_VARIANT || 'production';
  const isQa = variant === 'qa';
  const expo = { ...appJson.expo };

  if (isQa) {
    expo.name = 'findIndian QA';
    expo.slug = 'findIndian-de-qa';
    expo.scheme = 'findindianmobile-qa';
    expo.ios = {
      ...expo.ios,
      bundleIdentifier: 'com.findindian.de.qa',
    };
    expo.android = {
      ...expo.android,
      package: 'com.findindian.de.qa',
      googleServicesFile: './google-services-qa.json',
    };
  }

  return { expo };
};
