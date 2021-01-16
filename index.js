const fs = require("fs");
const [ file ] = process.argv.slice(2);
const boardFile = fs.readFileSync(process.cwd() + "/" + file, "utf-8").trimRight();
const readline = require("readline");
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

const start = boardFile.split("\n").map(r => r.split(""));

const hash = (r, c) => `${r},${c}`;
const unHash = str => {
    let [ r, c ] = str.split(",").map(Number);
    return { r, c }
};
const sleep = ms => new Promise(res => setTimeout(res, ms));

let alive = new Set();

for(let r in start) {
    for(let c in start[r]) {
        if(start[r][c] == "#") alive.add(hash(r, c));
    }
}

function nextIteration(grid) {
    let iteration = new Set();
    for(let cell of grid) {
        for(let dr of [-1,0,1]) {
            for(let dc of [-1,0,1]) {
                let adj = unHash(cell);
                adj.r += dr;
                adj.c += dc;
                let adjc = 0;
                for(let dr2 of [-1,0,1]) {
                    for(let dc2 of [-1,0,1]) {
                        if(dr2 == 0 && dc2 == 0) continue;
                        if(grid.has(hash(adj.r + dr2, adj.c + dc2))) adjc++;
                    }
                }
                let h = hash(adj.r, adj.c);
                if(adjc == 3 || (alive.has(h) && adjc == 2)) iteration.add(h);
            }
        }
    }
    return iteration;
}

let frames = 0;
let resetTime = 0;

setInterval(() => {
    frames = 0;
    resetTime = process.uptime();
}, 1000)

let config = {
    row: 0,
    col: 0,
    size: 20,
    fps: 10
}

function boardToString(grid, roff, coff, size) {
    let str = `Target fps: ${config.fps} | Real fps: ${(frames / (process.uptime() - resetTime)).toFixed(1)} | Cells: ${alive.size}\n`
    str += `Zoom: ${config.size}/50 | X: ${config.col} | Y: ${config.row}\n`;
    str += "WASD or arrows to move | Q/E or N/M for zoom\n";
    str += "I/O to change fps | C to close | R to restart\n";
    str += "┌" + "─".repeat(size * 2) + "┐\n"
    for(let r = roff; r < roff + size; r++) {
        str += "│";
        for(let c = coff; c < coff + (size * 2); c++) {
            if(grid.has(hash(r,c))) str += "#"; else str += " ";
        }
        str += "│\n";
    }
    return str + "└" + "─".repeat(size * 2) + "┘";
}

process.stdin.on("keypress", (_str, key) => {
    switch(key.name) {
        case "up":
        case "w":
            config.row--;
            break;
        case "a":
        case "left":
            config.col--;
            break;
        case "down":
        case "s":
            config.row++;
            break;
        case "right":
        case "d":
            config.col++;
            break;
        case "n":
        case "q":
            if(config.size < 50) config.size++;
            break;
        case "m":
        case "e":
            if(config.size > 1) config.size--;
            break;
        case "i":
            config.fps++;
            break;
        case "o":
            if(config.fps > 1) config.fps--;
            break;
        case "r":
            alive = new Set();
            for(let r in start) {
                for(let c in start[r]) {
                    if(start[r][c] == "#") alive.add(hash(r, c));
                }
            }
            break;
        case "c":
            process.exit(0);
    }
});

(async () => {
    while(true) {
        frames++;
        console.clear();
        console.log(boardToString(alive, config.row, config.col, config.size));
        alive = nextIteration(alive);
        await sleep(Math.ceil(1000 / config.fps));
    }
})();
