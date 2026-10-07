// Turns the single-file preview build into a page for a Claude Artifact preview link.
// The Artifact host supplies its own <html>/<head>/<body>, so we keep only the
// title, the stylesheet, the app's markup and the module script.
// The embedded sample book contains its own <head>, <style> and <body> inside a
// JS string, so tags are located by position rather than with greedy regexes.
import { readFileSync, writeFileSync } from 'node:fs';

const [input = 'dist-preview/index.html', output = 'dist-preview/artifact.html'] = process.argv.slice(2);
const html = readFileSync(input, 'utf8');

const scriptStart = html.indexOf('<script type="module"');
const scriptEnd = html.indexOf('</script>', scriptStart) + '</script>'.length;
const styleStart = html.indexOf('<style rel="stylesheet"');
const styleEnd = html.indexOf('</style>', styleStart) + '</style>'.length;
const bodyStart = html.lastIndexOf('<body>') + '<body>'.length;
const bodyEnd = html.lastIndexOf('</body>');
const title = html.slice(0, scriptStart).match(/<title>.*?<\/title>/)?.[0] ?? '<title>Kind Book Notes</title>';

if ([scriptStart, styleStart].includes(-1)) throw new Error('Unexpected build output: script or stylesheet not found');

writeFileSync(
  output,
  [title, html.slice(styleStart, styleEnd), html.slice(bodyStart, bodyEnd).trim(), html.slice(scriptStart, scriptEnd)].join('\n'),
);
console.log(`Wrote ${output}`);
