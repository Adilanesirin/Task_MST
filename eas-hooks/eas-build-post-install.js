#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting EAS Build post-install hook...');

// Critical React Native modules that must be present
const criticalModules = [
  '@react-native-async-storage/async-storage',
  '@react-native-community/netinfo',
  '@react-native-masked-view/masked-view',
  'lottie-react-native',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-webview',
  'react-native-worklets'
];

console.log('📦 Verifying React Native modules...');

const nodeModulesPath = path.join(__dirname, '../node_modules');
let missingModules = [];
let missingAndroidBuilds = [];

criticalModules.forEach(moduleName => {
  const modulePath = path.join(nodeModulesPath, moduleName);
  
  if (!fs.existsSync(modulePath)) {
    missingModules.push(moduleName);
    console.error(`❌ Missing module: ${moduleName}`);
  } else {
    // Check for Android build.gradle
    const androidBuildGradle = path.join(modulePath, 'android', 'build.gradle');
    if (!fs.existsSync(androidBuildGradle)) {
      missingAndroidBuilds.push(moduleName);
      console.warn(`⚠️  Module ${moduleName} missing android/build.gradle`);
    } else {
      console.log(`✅ ${moduleName}`);
    }
  }
});

if (missingModules.length > 0) {
  console.error('\n❌ ERROR: Missing critical React Native modules!');
  console.error('Missing modules:', missingModules.join(', '));
  console.error('\nTry running: npm install');
  process.exit(1);
}

if (missingAndroidBuilds.length > 0) {
  console.warn('\n⚠️  WARNING: Some modules missing Android build files:');
  console.warn(missingAndroidBuilds.join(', '));
}

console.log('\n✅ All critical React Native modules verified');

// Fix Gradle configuration
console.log('\n🔧 Fixing Gradle configuration...');

const buildGradlePath = path.join(__dirname, '../android/build.gradle');

if (fs.existsSync(buildGradlePath)) {
  console.log('📝 Found android/build.gradle, removing JFrog references...');
  
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Remove lines containing JFrog buildinfo
  content = content.split('\n')
    .filter(line => !line.includes('org.jfrog.buildinfo'))
    .filter(line => !line.includes('com.jfrog.artifactory'))
    .join('\n');
  
  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log('✅ Gradle configuration fixed');
} else {
  console.log('⚠️  android/build.gradle not found yet, will be generated during build');
}

// Log environment info
console.log('\n📊 Build environment info:');
console.log(`Node version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`CWD: ${process.cwd()}`);

console.log('\n✅ Post-install hook completed successfully!');