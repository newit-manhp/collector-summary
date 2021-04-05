const fs = require('fs');
const { Transform } = require('stream');
const { initial, isEmpty, last, map, reduce } = require('lodash');

const readStream = process.stdin;
// const readStream = fs.createReadStream('./log.log');

const processLineByLine = () => {
  let buffer = '';
  return new Transform({
    objectMode: true,
    transform(chunk, _, done) {
      const data = (buffer + chunk.toString()).split(/\r?\n/g);
      if (!isEmpty(data)) {
        buffer = last(data);
      }
      const init = initial(data);
      for (const line of init) {
        const pattern = /([0-9\|.: -]+),(.*)/g;
        while ((m = pattern.exec(line))) {
          this.push({
            time: new Date(m[1]).getTime(),
            text: `${m[2]}`,
          });
        }
      }
      done();
    },
    flush(done) {
      if (!isEmpty(buffer)) {
        this.push(buffer);
      }
      done();
    },
  });
};

const parseItem = new Transform({
  objectMode: true,
  writableObjectMode: true,
  transform({ time, text }, _, done) {
    if (
      (m = /(\d+).*items collected from mercari. \{.*'(.*)'\s?\}/.exec(text))
    ) {
      // mercari collected
      this.push({
        time,
        type: 'mercari_collected',
        total: parseInt(m[1]),
        shop: `${m[2]}`,
      });
      return done();
    }

    if (
      (m = /(\d+) items of (.*?) put to pool with key: (.*?)\..*'(.*)'\s\}/g.exec(
        text
      ))
    ) {
      // collection summary
      this.push({
        time,
        type: 'collection_report',
        count: parseInt(m[1]),
        collection: `${m[2]}`,
        key: `${m[3]}`,
        shop: `${m[4]}`,
      });
      return done();
    }
    done();
  },
});

const partitionByShop = () => {
  return new Transform({
    objectMode: true,
    writableObjectMode: true,
    transform({ shop, type, time, ...rest }, _, done) {
      if (!this.shops) {
        this.shops = new Map();
      }
      switch (type) {
        case 'collection_report': {
          if (!this.shops.get(shop)) {
            this.shops.set(shop, {
              collections: new Map(),
            });
          }
          const { collection, count, key } = rest;
          this.shops.get(shop).collections.set(collection, { count, key });
          break;
        }
        case 'mercari_collected': {
          if (!this.shops.get(shop)) {
            this.shops.set(shop, {
              collections: new Map(),
            });
          }
          const { total } = rest;
          this.shops.get(shop).total = total;
          break;
        }
      }
      done();
    },
    flush(done) {
      const data = Object.fromEntries(
        map(Array.from(this.shops.entries()), ([shopName, shop]) => {
          const collections = Array.from(shop.collections.entries()).map(
            ([key, { time, ...collection }]) => [
              key,
              {
                ...collection,
              },
            ]
          );
          return [
            shopName,
            {
              actual: shop.total,
              total: reduce(
                collections,
                (prev, curr) => prev + (curr[1].count || 0),
                0
              ),
              collections: Object.fromEntries(collections),
            },
          ];
        })
      );
      this.push(
        JSON.stringify(
          {
            total: reduce(data, (prev, curr) => prev + (curr.actual || 0), 0),
            shops: data,
          },
          null,
          2
        )
      );
      done();
    },
  });
};

readStream
  .pipe(processLineByLine())
  .pipe(parseItem)
  .pipe(partitionByShop())
  .pipe(process.stdout, { end: false })
  // .pipe(fs.createWriteStream('result.json'))
  .on('error', (err) => {
    console.error(err);
  });
