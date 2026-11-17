import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('lovable/google-maps-integration-main/src/data/ward57-geometry.ts', 'utf8');

function extract(name) {
  const start = src.indexOf(`export const ${name}`);
  const from = src.indexOf('= [', start) + 2;
  let depth = 0;
  for (let i = from; i < src.length; i += 1) {
    if (src[i] === '[') depth += 1;
    else if (src[i] === ']') {
      depth -= 1;
      if (depth === 0) {
        const body = src.slice(from, i + 1).replace(/,(\s*[\]}])/g, '$1');
        return JSON.parse(body);
      }
    }
  }
  throw new Error(`Unclosed ${name}`);
}

const outline = extract('WARD_57_OUTLINE');
const route = extract('COLLECTION_ROUTE');
writeFileSync('src/data/ward57ClientGeometry.json', JSON.stringify({ outline, route }));
console.log('outline', outline.length, 'route', route.length);
