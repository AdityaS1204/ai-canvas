import { compile } from 'tailwindcss';
import fs from 'fs';
import path from 'path';

async function build() {
  console.log('Compiling Tailwind CSS with Bun...');
  const inputCss = fs.readFileSync(path.join(process.cwd(), 'app/globals.source.css'), 'utf-8');
  
  // Find all class candidates in app, components, lib
  const files = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '.next') {
        scan(full);
      } else if (e.isFile() && /\.(tsx|ts|jsx|js|html)$/.test(e.name)) {
        files.push(full);
      }
    }
  }
  scan(path.join(process.cwd(), 'app'));
  scan(path.join(process.cwd(), 'components'));
  scan(path.join(process.cwd(), 'lib'));

  const candidates = new Set();
  const classRegex = /className=["'`]([^"'`]+)["'`]/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let m;
    while ((m = classRegex.exec(content)) !== null) {
      m[1].split(/\s+/).forEach(c => {
        if (c.trim()) candidates.add(c.trim());
      });
    }
    // Also scan for utility candidates
    const matches = content.match(/[\w\-\/\[\]\:\.\#\%]+/g) || [];
    for (const token of matches) {
      if (token.length > 1 && !token.startsWith('//')) candidates.add(token);
    }
  }

  const twDir = path.join(process.cwd(), 'node_modules/tailwindcss');

  const compiler = await compile(inputCss, {
    base: process.cwd(),
    loadStylesheet: async (id, base) => {
      if (id === 'tailwindcss' || id === 'tailwindcss/index.css') {
        return {
          content: fs.readFileSync(path.join(twDir, 'index.css'), 'utf-8'),
          base: twDir,
        };
      }
      if (id.startsWith('tailwindcss/')) {
        const sub = id.replace('tailwindcss/', '');
        const p = path.join(twDir, sub);
        if (fs.existsSync(p)) {
          return { content: fs.readFileSync(p, 'utf-8'), base: path.dirname(p) };
        }
      }
      const resolved = path.resolve(base, id);
      if (fs.existsSync(resolved)) {
        return { content: fs.readFileSync(resolved, 'utf-8'), base: path.dirname(resolved) };
      }
      throw new Error(`Cannot resolve stylesheet: ${id} from ${base}`);
    },
  });

  const output = compiler.build(Array.from(candidates));

  fs.writeFileSync(path.join(process.cwd(), 'app/globals.css'), output);
  console.log(`Successfully compiled Tailwind CSS (${Math.round(output.length / 1024)} KB) with ${candidates.size} candidates!`);
}

build().catch(console.error);
