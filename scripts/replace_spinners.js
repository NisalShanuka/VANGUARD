const fs = require('fs');
const path = require('path');

const NEW_SPINNER = '<div className="relative flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-400 shadow-[0_0_10px_#c8c8c84d]"></div><div className="absolute inset-[-4px] rounded-full border border-white/5 animate-pulse"></div></div>';

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Pattern 1: <div className="h-8 w-8 animate-spin rounded-none border-b-2 border-white"></div>
            content = content.replace(/<div\s+className="h-8\s+w-8\s+animate-spin\s+rounded-none\s+border-b-2\s+border-white"\s*>\s*<\/div>/g, NEW_SPINNER);

            // Pattern 2: <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-none animate-spin" />
            content = content.replace(/<div\s+className="h-8\s+w-8\s+border-2\s+border-white\s+border-t-transparent\s+rounded-none\s+animate-spin"\s*\/>/g, NEW_SPINNER);

            // Pattern 3: <span className="h-3 w-3 border border-black border-t-transparent rounded-none animate-spin" />
            const SMALL_SPINNER = '<div className="relative flex items-center justify-center"><div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-black/10 border-t-black"></div></div>';
            content = content.replace(/<span\s+className="h-3\s+w-3\s+border\s+border-black\s+border-t-transparent\s+rounded-none\s+animate-spin"\s*\/>/g, SMALL_SPINNER);

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}

walkDir(path.join(__dirname, '../src'));
console.log('Done replacing spinners');
