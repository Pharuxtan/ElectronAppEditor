
const readSourceHash = function (bytecodeBuffer) {

  if (!Buffer.isBuffer(bytecodeBuffer)) {
    throw new Error(`bytecodeBuffer must be a buffer object.`);
  }

  if (process.version.startsWith('v8.8') || process.version.startsWith('v8.9')) {
    return bytecodeBuffer.slice(12, 16).reduce((sum, number, power) => sum += number * Math.pow(256, power), 0);
  } else {
    return bytecodeBuffer.slice(8, 12).reduce((sum, number, power) => sum += number * Math.pow(256, power), 0);
  }
};

let file = require("fs").readFileSync("./basic.jsc");

let length = readSourceHash(file);

console.log(length);

let dummyCode = "";

if (length > 1) {
  dummyCode = '"' + "\u200b".repeat(length - 2) + '"'; // "\u200b" Zero width space
}

console.log(dummyCode);
