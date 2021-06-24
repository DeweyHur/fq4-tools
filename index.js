const fs = require('fs/promises');
const Canvas = require('canvas');

const states = [ 'up', 'left', 'down', 'right', 'hit', 'dead' ];

(async () => {
    const files = await fs.readdir('./raw');
    let sprites = await Promise.all(
        files.map(async (file) => {
            const content = await fs.readFile(`./raw/${file}`);
            const src = await Canvas.loadImage(content);
            const srcCanvas = Canvas.createCanvas(src.width, src.height);
            const srcContext = srcCanvas.getContext('2d');
            srcContext.drawImage(src, 0, 0);

            const ret = [];
            const sw = 16, sh = 32;
            let prevData;
            for (let srcCur = 0, destCur = 0, index = 0; srcCur < ~~(src.width * sh / 2); srcCur += sh, destCur += sw, ++index) {
                const srcSx = (~~(srcCur / src.height)) * sw, srcSy = srcCur % src.height;
                const destSx = destCur % src.width, destSy = (~~(destCur / src.width)) * sh;
                console.assert(srcSx < src.width && srcSy < src.height && destSx < src.width && destSy < src.height);
                const imageData = srcContext.getImageData(srcSx, srcSy, sw, sh);
                for (let index = 0; index < imageData.data.length; index += 4) {
                    if (imageData.data.slice(index, index + 3).reduce((sum, x) => sum + x, 0) === 0) {
                        imageData.data[index + 3] = 0;
                    }
                }

                if (index % 2) {
                    const out = Canvas.createCanvas(32, 32);
                    const outContext = out.getContext('2d');
                    outContext.putImageData(prevData, 0, 0);
                    outContext.putImageData(imageData, sw, 0);
                    ret.push(out);

                } else {
                    prevData = imageData;
                }
            }

            return ret;
        })
    );

    const units = [];
    sprites = sprites.flat();    
    for (let index = 0; units.length < 171; index += 12) {
        const unit = {};
        states.reduce((cnt, state) => {
            unit[state] = [sprites[cnt], sprites[cnt + 1]];
            return cnt + 2;
        }, index);
        units.push(unit);
    }

    for( let unitIndex = 0; unitIndex < units.length; ++unitIndex ) {
        const unit = units[unitIndex];
        Object.entries(unit).forEach(async ([state, canvases]) => {
            for( let canvasIndex = 0; canvasIndex < canvases.length; ++canvasIndex ) {
                const canvas = canvases[canvasIndex];
                await fs.writeFile(`./out/${unitIndex}_${state}_${canvasIndex}.png`, canvas.toBuffer('image/png'));
            }    
        });
    }
    console.log('Done!');    
})();
