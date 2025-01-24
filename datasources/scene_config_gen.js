const fs = require('fs');
const path = require('path');

// Specify the directory containing the scenes
const scenesDirectory = path.join(__dirname, 'scenes');

// Function to generate the scene configuration
const generateSceneConfig = () => {
    const sceneConfig = [];
    
    // Read files from the scenes directory
    fs.readdir(scenesDirectory, (err, files) => {
        if (err) {
            console.error('Error reading the scenes directory:', err);
            return;
        }

        files.forEach(file => {
            const fileNameWithoutExtension = path.parse(file).name; // Get file name without extension
            const sceneName = fileNameWithoutExtension.replace(/_/g, ' '); // Replace underscores with spaces for a nicer scene name

            // Add the scene to the config array as an object with name and filename
            sceneConfig.push({
                name: sceneName,
                filename: file
            });
        });

        // Write the config to a JSON file
        fs.writeFile('sceneConfig.json', JSON.stringify(sceneConfig, null, 2), (err) => {
            if (err) {
                console.error('Error writing the config file:', err);
            } else {
                console.log('Scene configuration generated successfully: sceneConfig.json');
            }
        });
    });
};

// Execute the function
generateSceneConfig();
