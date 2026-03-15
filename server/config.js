const fs = require('fs');
const path = require('path');

// Determine AppData directory
const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
const configDir = path.join(appDataPath, 'WorkshopApp');
const configFile = path.join(configDir, 'config.json');

// Ensure config directory exists
if (!fs.existsSync(configDir)) {
  try {
    fs.mkdirSync(configDir, { recursive: true });
  } catch (err) {
    console.error("Could not create config directory in APPDATA:", err.message);
  }
}

// Default config structure
const defaultConfig = {
  dbPath: '' // Empty means use default local folder
};

// Read config
function getConfig() {
  if (fs.existsSync(configFile)) {
    try {
      const data = fs.readFileSync(configFile, 'utf8');
      return { ...defaultConfig, ...JSON.parse(data) };
    } catch (err) {
      console.error("Error reading config file:", err.message);
      return defaultConfig;
    }
  }
  return defaultConfig;
}

// Write config
function setConfig(newConfig) {
  const currentConfig = getConfig();
  const mergedConfig = { ...currentConfig, ...newConfig };
  try {
    fs.writeFileSync(configFile, JSON.stringify(mergedConfig, null, 2));
    return true;
  } catch (err) {
    console.error("Error writing config file:", err.message);
    return false;
  }
}

module.exports = {
  getConfig,
  setConfig
};
