const hasProperty = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

const parseError = (err, hideStack = []) => {
  let toReturn = err.message;
  if (err?.stack?.length > 0 && !hideStack.includes(err.message)) {
    const stack = err.stack.split('\n');
    if (stack[1]) {
      toReturn += stack[1].replace('   ', '');
    }
  }
  return toReturn;
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export { hasProperty, parseError, sleep };
