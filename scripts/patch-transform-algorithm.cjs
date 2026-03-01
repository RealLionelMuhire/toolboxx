/**
 * Suppresses transformAlgorithm error spam (nodejs/node#62036).
 * Run: node -r ./scripts/patch-transform-algorithm.cjs .next/standalone/server.js
 */
const orig = process.stderr.write.bind(process.stderr);
process.stderr.write = function (chunk, encodingOrCb, cb) {
  const str = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8');
  if (str.includes('transformAlgorithm')) return true;
  return orig(chunk, encodingOrCb, cb);
};
