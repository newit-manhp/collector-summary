const fs = require('fs');
const { Transform } = require('stream');
const { initial, isEmpty, last, map, reduce } = require('lodash');

const readStream = process.stdin;
// const readStream = fs.createReadStream('./log.txt');

const isEmpty = (item) => item == '' || item == {} || item == [];

const processLineByLine = () => {
  let buffer = '';
  return new Transform({
    objectMode: true,
    transform(chunk, _, done) {
      const data = (buffer + chunk.toString()).split(/\r?\n/g);
      if (!isEmpty(data)) {
        buffer = last(data);
      }
      const src = initial(data).join(' ');
      const pattern = /\]\s+(.*?)\s+(\d{13,13})/g;
      while ((m = pattern.exec(src))) {
        if (
          /Started for:|Finished for:|items collected from mercari|collector started \{|items of|collector finished \{/.test(
            `${m[1]}`
          )
        ) {
          this.push({
            time: parseInt(m[2]),
            text: `${m[1]}`,
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
    if ((m = /collector started \{.*'(.*)'.*\}/.exec(text))) {
      // for start collector
      this.push({
        time,
        type: 'collector_started',
        shop: `${m[1]}`,
      });
      return done();
    }
    if ((m = /collector finished \{.*'(.*)'.*\}/.exec(text))) {
      // for start collector
      this.push({
        time,
        type: 'collector_finished',
        shop: `${m[1]}`,
      });
      return done();
    }
    if ((m = /Started for:\s+(.*) \{.*'(.*)'\s?\}/.exec(text))) {
      // for start collection
      this.push({
        time,
        type: 'collection_started',
        collection: `${m[1]}`,
        shop: `${m[2]}`,
      });
      return done();
    }
    if ((m = /Finished for:\s+(.*) \{.*'(.*)'\s?\}/.exec(text))) {
      // collection finished
      this.push({
        time,
        type: 'collection_finished',
        collection: `${m[1]}`,
        shop: `${m[2]}`,
      });
      return done();
    }
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
        case 'collector_started': {
          if (this.shops.has(shop)) {
            if (this.shops.get(shop).time < time) {
              this.shops.set(shop, { time, collections: new Map() });
            }
          } else {
            this.shops.set(shop, { time, collections: new Map() });
          }
          break;
        }
        case 'collector_finished': {
          this.shops.get(shop).end_time = time;
          break;
        }
        case 'collection_started': {
          const { collection } = rest;
          this.shops.get(shop).collections.set(collection, { time });
          break;
        }
        case 'collection_finished': {
          const { collection } = rest;
          this.shops.get(shop).collections.get(collection).end_time = time;
          break;
        }
        case 'collection_report': {
          const { collection, count, key } = rest;
          this.shops.get(shop).collections.get(collection).count = count;
          this.shops.get(shop).collections.get(collection).key = key;
          break;
        }
        case 'mercari_collected': {
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
                start_time: time,
                duration: (collection.end_time - time) / 1000,
              },
            ]
          );
          return [
            shopName,
            {
              actual: shop.total,
              duration: (shop.end_time - shop.time) / 1000,
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
  .pipe(process.stdout)
  .on('error', (err) => {
    console.error(err);
  });
