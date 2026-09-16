/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "notification-service",
  // Matches the main app's minimum iOS version (see ios/*.xcodeproj IPHONEOS_DEPLOYMENT_TARGET).
  deploymentTarget: "15.1",
  entitlements: {},
});
