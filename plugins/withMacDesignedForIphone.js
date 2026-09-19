const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Same as Flutter's iOS Xcode default. Lets App Store Connect stamp Minimum macOS Version
 * so Mac TestFlight can install the iOS IPA.
 */
function withMacDesignedForIphone(config) {
  return withXcodeProject(config, (mod) => {
    const configs = mod.modResults.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configs)) {
      const buildSettings = configs[key].buildSettings;
      if (!buildSettings?.IPHONEOS_DEPLOYMENT_TARGET) continue;
      buildSettings.SUPPORTS_MAC_DESIGNED_FOR_IPHONE_IPAD = 'YES';
      buildSettings.SUPPORTS_MACCATALYST = 'NO';
    }
    return mod;
  });
}

module.exports = withMacDesignedForIphone;
