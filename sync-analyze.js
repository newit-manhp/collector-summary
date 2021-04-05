const fs = require('fs');
const { argv, exit } = require('process');
if (argv.length != 3) {
  console.error('Invalid. Usage: node sync-analyze <psocessed content>');
  console.log(argv)
  exit(1);
}
const shops = JSON.parse(process.argv[2]);
const shopResult = new Map();
for (const shopOp of shops) {
  let shopInfo = {
    started: false,
    total: 0,
  };
  for (const { op, shop, value } of shopOp) {
    if (shopResult.has(shop)) {
      continue;
    }
    if (op == 'started' && shopInfo.started) {
      break;
    }
    switch (op) {
      case 'started':
        shopInfo.started = true;
        shopInfo.name = shop;
        break;
      case 'deleted':
        // remove item deleted
        shopInfo.total -= parseInt(value.split('/')[0]);
        break;
      case 'added':
        shopInfo.total += parseInt(value.split('/')[0]);
        break;
      case 'xinanyu':
        shopInfo.total += parseInt(value);
        break;
    }
  }
  shopInfo.name &&
    !shopResult.has(shopInfo.name) &&
    shopResult.set(shopInfo.name, shopInfo.total);
}

console.log('detail: ', shopResult);
console.log(
  'total: ',
  Array.from(shopResult.values()).reduce((p, c) => p + c, 0)
);
