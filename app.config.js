const appJson = require("./app.json");

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo?.ios,
      bundleIdentifier:
        appJson.expo?.ios?.bundleIdentifier || "com.yagizerdenler.sportner",
      config: {
        ...(appJson.expo?.ios?.config || {}),
        ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
      },
    },
    android: {
      ...appJson.expo?.android,
      package: appJson.expo?.android?.package || "com.anonymous.sportner",
      config: {
        ...(appJson.expo?.android?.config || {}),
        ...(googleMapsApiKey
          ? {
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            }
          : {}),
      },
    },
  },
};
