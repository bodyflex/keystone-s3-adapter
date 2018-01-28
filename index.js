const fs = require('fs');
const AWS = require('aws-sdk');
const {promisify} = require('util');
const nameFunctions = require('keystone-storage-namefunctions');
const ensureCallback = require('keystone-storage-namefunctions/ensureCallback');

const DEFAULT_OPTIONS = {
	key: process.env.S3_KEY,
	secret: process.env.S3_SECRET,
	bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION,
  digitalOcean: false,
	generateFilename: nameFunctions.randomFilename,
};

class S3FileAdapter {

  constructor(options, schema) {
    this.options = {...DEFAULT_OPTIONS, ...options.storage };

    if (!this.options.key || !this.options.secret || !this.options.bucket || !this.options.region) {
      throw new Error('All these options are required: key, secret, bucket and region.');
    }
    
    const awsOptions = {
      accessKeyId: this.options.key,
      secretAccessKey: this.options.secret,
    };
    if (this.options.digitalOcean) {
      awsOptions.endpoint = `https://${this.options.region}.digitaloceanspaces.com`;
    }
    this.client = new AWS.S3(awsOptions);

    this.client.uploadPromise = promisify(this.client.upload);
    this.client.headPromise = promisify(this.client.headObject);
    this.client.deletePromise = promisify(this.client.deleteObject);

    this.options.generateFilename = promisify(ensureCallback(this.options.generateFilename));
  }

  async uploadFile(file, callback) {
    try {
      const filename = await this.options.generateFilename(file, 0);

      const response = await this.client.uploadPromise({
        ACL: this.options.ACL,
        Bucket: this.options.bucket,
        Body: fs.createReadStream(file.path),
        Key: filename,
        ContentType: file.mimetype,
        ContentLength: file.size
      });

      file.etag = response.Etag;
      file.filename = response.Key;
      file.path = `${this.client.endpoint.href}${this.options.bucket}/${filename}`;
      file.bucket = response.Bucket;

      callback(null, file);
    } catch (err) {
      callback(err);
    }
  }

  getFileURL(file) {
    return file.path;
  }

  async removeFile(file, callback) {
    try {
      await this.client.deletePromise({
        Bucket: this.options.bucket,
        Key: file.filename
      });
      callback();
    } catch (err) {
      callback(err);
    }
  }

  async fileExists(filename, callback) {
    try {
      await this.client.head({
        Bucket: this.options.bucket,
        Key: file.filename
      });
      callback(null, true);
    } catch (e) {
      callback(null, false);
    }
  }
  
}

S3FileAdapter.compatibilityLevel = 1;

S3FileAdapter.SCHEMA_TYPES = {
	filename: String,
	bucket: String,
	path: String,
	etag: String
};

S3FileAdapter.SCHEMA_FIELD_DEFAULTS = {
	filename: true,
	bucket: false,
	path: false,
	etag: false
};

module.exports = S3FileAdapter;
