import { escape } from 'lodash';
import { z } from 'zod';

const buildSchemaObject = (allowedFields, requiredFields, transforms = {}) => {
  const obj = {};
  for (const key of allowedFields) {
    obj[key] = requiredFields.includes(key)
      ? z
          .string()
          .transform(val => escape(val))
          .transform(async val =>
            Object.prototype.hasOwnProperty.call(transforms, key)
              ? await handleHash(transforms[key], val)
              : val
          )
      : z
          .string()
          .transform(val => escape(val))
          .transform(async val =>
            Object.prototype.hasOwnProperty.call(transforms, key)
              ? await handleHash(transforms[key], val)
              : val
          )
          .optional();
  }
  return obj;
};

const handleHash = async (algorithm, string) => {
  const digestMap = {
    sha1: 'SHA-1',
    sha256: 'SHA-256',
    sha384: 'SHA-384',
    sha512: 'SHA-512',
    md5: 'MD5'
  };

  const encoder = new TextEncoder();
  const arrayBuffer = encoder.encode(string);
  const hashBuffer = await crypto.subtle.digest(
    {
      name: digestMap[algorithm]
    },
    arrayBuffer
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string

  return hashHex;
};

export { buildSchemaObject };
