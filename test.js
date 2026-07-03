const fn1 = async () => {
  return new Promise((resolve) => {
    console.log("fn1");
    resolve(12);
  });
};

const fn2 = async () => {
  return fn1();
};

(async () => {
  const result = await fn2();
  console.log("done", result);
})();
