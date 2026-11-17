const headers = { 'User-Agent': 'bswml-demo/1.0 (hackathon demo)' };
const query = '[out:json][timeout:40];(node["name"~"Raman Nagar"](12.90,77.55,13.05,77.75);way["name"~"Raman Nagar"](12.90,77.55,13.05,77.75);rel["name"~"Raman Nagar"](12.90,77.55,13.05,77.75););out tags bb;';
const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
const res = await fetch(url, { headers });
const text = await res.text();
console.log(res.status, text.slice(0, 4000));
