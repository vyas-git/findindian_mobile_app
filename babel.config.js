module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Worklets plugin is added automatically by babel-preset-expo when
    // react-native-worklets is installed. Do not add reanimated/plugin here.
  };
};
