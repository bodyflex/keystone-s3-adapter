# Keystone S3 Adapter

Also works with DigitalOcean spaces.

## Install

```npm install keystone-s3-adapter```

## Use

```js
const adapter = require('keystone-s3-adapter');

const storage = new keystone.Storage({
  adapter: adapter,
  storage: {
    key: process.env.S3_KEY,
    secret: process.env.S3_SECRET,
    bucket: 'mybucket',
    region: 'ams3',
    digitalOcean: true,
    ACL: 'public-read'
  }
});
```
