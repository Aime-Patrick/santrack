/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS build utility, run with `node`, not bundled */
const fs = require('fs');
const { PNG } = require('pngjs');

const srcPath = 'public/images/ribbon.png';
const dstPath = 'public/images/ribbon-full.png';

fs.createReadStream(srcPath)
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    const width = this.width;
    const height = this.height;

    // For every column, find the lowest opaque/colored pixel (the bottom edge of the green ribbon)
    for (let x = 0; x < width; x++) {
      let lastSolidY = -1;
      let lastR = 0, lastG = 149, lastB = 60; // Rwanda Green fallback: #00953C

      for (let y = height - 1; y >= 0; y--) {
        const idx = (width * y + x) << 2;
        const a = this.data[idx + 3];
        if (a > 30) {
          lastSolidY = y;
          lastR = this.data[idx];
          lastG = this.data[idx + 1];
          lastB = this.data[idx + 2];
          break;
        }
      }

      // If we found the bottom of the ribbon in this column, fill everything below it with the solid green color!
      if (lastSolidY !== -1) {
        for (let y = lastSolidY + 1; y < height; y++) {
          const idx = (width * y + x) << 2;
          this.data[idx] = lastR;
          this.data[idx + 1] = lastG;
          this.data[idx + 2] = lastB;
          this.data[idx + 3] = 255;
        }
      }
    }

    this.pack().pipe(fs.createWriteStream(dstPath)).on('finish', () => {
      console.log('Successfully generated ribbon-full.png with solid green bottom!');
    });
  });
