const fs = require('fs');
const path = require('path');

// JSON data containing scenes (replace with your actual JSON data or read from a file)
const data = require('./scenes.json')

// Generate download commands
const downloadCommands = data.scenes
  .filter(scene => scene.audio && scene.audio.download_url)
  .map(scene => {
    const fileName = scene.title.replace(/\s+/g, '_') + '.m4a';
    const url = scene.audio.download_url;
    return `curl -o scenes/${fileName} "${url}"`;
  })
  .join('\n');

// Write the commands to a Bash script
fs.writeFileSync(path.join(__dirname, 'download_audio_files.sh'), `#!/bin/bash\nmkdir -p scenes\n${downloadCommands}\n`, 'utf8');

console.log('Download script generated: download_audio_files.sh');
