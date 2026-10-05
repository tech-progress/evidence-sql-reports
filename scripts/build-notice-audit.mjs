import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';

const root = '/src';
const digest = (content) => createHash('sha256').update(content).digest('hex');
const normalize = (identifier) => identifier.startsWith(root + '/') ? relative(root, identifier) : identifier;

export function noticeAudit(label) {
  let server = false;
  return {
    name: 'recipe-original-input-notice-audit',
    configResolved(config) { server = Boolean(config.build.ssr); },
    generateBundle(options, bundle) {
      const outputs = Object.entries(bundle).map(([filename, output]) => ({
        filename,
        kind: output.type,
        sha256: digest(output.type === 'chunk' ? output.code : output.source),
        modules: output.type === 'chunk' ? Object.entries(output.modules).map(([identifier, details]) => {
          const filename = identifier.split('?')[0];
          const original = isAbsolute(filename) && filename.startsWith(root + '/') && existsSync(filename)
            ? readFileSync(filename) : null;
          return { input: normalize(identifier), renderedLength: details.renderedLength,
            originalLength: details.originalLength, originalSha256: original ? digest(original) : null };
        }) : [],
      }));
      mkdirSync(root + '/artifact-build', { recursive: true });
      const name = (label + (server ? '-server' : '-client')).replace(/[^a-zA-Z0-9_.-]/g, '_');
      writeFileSync(root + '/artifact-build/' + name + '.json', JSON.stringify({
        scope: 'Original input and generated output identities; rendered length is not a license or universal non-inclusion conclusion',
        outputs,
      }, null, 2) + '\n');
    },
  };
}
