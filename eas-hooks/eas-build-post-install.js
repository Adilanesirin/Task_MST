#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Gradle configuration for EAS Build...');

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

console.log('✅ Post-install hook completed');