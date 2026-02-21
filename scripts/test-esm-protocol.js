try {
  const barePath = 'C:\\some\\nonexistent\\file.js';
  console.log('Testing bare path:', barePath);
  await import(barePath);
} catch (e) {
  console.error('Bare path error:', e.message);
}

try {
  const malformedUrl = 'file:///C:\\some\\nonexistent\\file.js';
  console.log('Testing malformed URL:', malformedUrl);
  await import(malformedUrl);
} catch (e) {
  console.error('Malformed URL error:', e.message);
}
