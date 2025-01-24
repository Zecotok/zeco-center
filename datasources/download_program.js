const fs = require('fs');
const path = require('path');
const https = require('https');

// Sample program data (you would normally retrieve this from an API or another source)
const programData = require("./deepconcentration.json");

async function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve); // close() is async, call resolve after close completes.
            });
        }).on('error', err => {
            fs.unlink(filePath); // Delete the file async. (But we don't care about the error here.)
            reject(err);
        });
    });
}

async function main() {
    const programTitle = programData.program.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const programDir = path.join(__dirname, "programs", programTitle);
    
    // Create program directory
    if (!fs.existsSync(programDir)) {
        fs.mkdirSync(programDir);
    }

    // Create a configuration object to store guide information
    const config = [];

    // Download each guide
    for (const guide of programData.program.guides) {
        const guideTitle = guide.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filePath = path.join(programDir, `${guideTitle}.m4a`);
        
        try {
            await downloadFile(guide.asset.download_url, filePath);
            config.push({ fileName: `${guideTitle}.m4a`, guideName: guide.title });
            console.log(`Downloaded: ${guide.title}`);
        } catch (error) {
            console.error(`Failed to download ${guide.title}:`, error.message);
        }
    }

    // Create a config file
    const configFilePath = path.join(programDir, 'config.json');
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    console.log(`Config file created at: ${configFilePath}`);
}

// Run the main function
main().catch(err => console.error('Error:', err.message));
