import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const response = await fetch('https://codeload.github.com/evidence-dev/evidence/tar.gz/474ef4564f00e84991a055a3196fb32fd9d8d63a', { signal: AbortSignal.timeout(90000) });
if (!response.ok) throw new Error('Pinned source download failed');
const archive = Buffer.from(await response.arrayBuffer());
if (createHash('sha256').update(archive).digest('hex') !== '02d5200d5fb427b6fa204d984f10c12c9a62e9cb2a119828605244e635a53e16') {
  throw new Error('Pinned source checksum mismatch');
}
await writeFile('/tmp/evidence.tar.gz', archive);
