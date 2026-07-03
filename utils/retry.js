async function retry(fn, attempts = 3) {
  while (attempts--) {
    try {
      return await fn();
    } catch (e) {
      if (!attempts) throw e;
    }
  }
}

module.exports = retry;
