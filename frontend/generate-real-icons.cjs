const { Jimp } = require('jimp');
const fs = require('fs');

async function generateIcons() {
    try {
        console.log('Loading image...');
        const image = await Jimp.read('public/gmark-logo.png');
        
        console.log('Generating 192x192...');
        const img192 = image.clone();
        img192.resize({ w: 192, h: 192 });
        await img192.write('public/icon-192.png');
        
        console.log('Generating 512x512...');
        const img512 = image.clone();
        img512.resize({ w: 512, h: 512 });
        await img512.write('public/icon-512.png');
        
        console.log('Icons successfully generated!');
    } catch (err) {
        console.error('Error generating icons:', err);
    }
}

generateIcons();
