const { withAndroidManifest } = require("@expo/config-plugins");

function withAndroidPackageQueries(config, packageNames) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.queries = manifest.queries ?? [];

    if (manifest.queries.length === 0) {
      manifest.queries.push({});
    }

    const queries = manifest.queries[0];
    queries.package = queries.package ?? [];

    for (const packageName of packageNames) {
      const alreadyPresent = queries.package.some(
        (entry) => entry.$?.["android:name"] === packageName,
      );
      if (!alreadyPresent) {
        queries.package.push({ $: { "android:name": packageName } });
      }
    }

    return config;
  });
}

module.exports = withAndroidPackageQueries;
