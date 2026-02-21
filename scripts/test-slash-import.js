try {
  console.log('Testing leading slash import...');
  await import('/some/file.js');
} catch (e) {
  console.error('Leading slash error:', e.message);
}
