const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.blockList = [
  /react-dom\/server\.node/,
  /react-dom\/server/,
];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "web-streams-polyfill/ponyfill/es6": require.resolve("./stubs/webStreamsStub.js"),
  "react-dom/server.node": require.resolve("./stubs/reactDomServerStub.js"),
};

module.exports = config;
