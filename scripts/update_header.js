const fs = require('fs');
const file = 'c:\\\\Users\\\\NISAL\\\\Documents\\\\Vanguard Web\\\\VANGUARD\\\\src\\\\components\\\\Header.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/borderRadius: 0/g, 'borderRadius: 16');
content = content.replace(/width: (\d+), height: \1, borderRadius: 16/g, "width: $1, height: $1, borderRadius: '50%'");
content = content.replace(/height: 1\.5, background: 'rgba\(255,255,255,0\.65\)', borderRadius: 16/g, "height: 1.5, background: 'rgba(255,255,255,0.65)', borderRadius: 4");
fs.writeFileSync(file, content);
console.log('Done');
