const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withHoneywellCompileSdk(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const injection = `
subprojects { subproject ->
    afterEvaluate {
        if (subproject.hasProperty("android")) {
            subproject.android {
                compileSdkVersion 36
                buildToolsVersion "36.0.0"
            }
        }
    }
}
`;
      if (!config.modResults.contents.includes('compileSdkVersion 36')) {
        config.modResults.contents += injection;
      }
    }
    return config;
  });
};