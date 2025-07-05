# Storage Helpers

`src/hooks/useStorage.js` exposes small helpers for working with Supabase Storage.

## pathFromUrl

```js
const path = pathFromUrl(publicUrl);
```

Extracts the storage path from a public URL returned by Supabase.

## uploadFile

```js
const url = await uploadFile('products', file, 'images');
```

Uploads a file to the given bucket and optional folder. Resolves with the public URL of the uploaded file.

## deleteFile

```js
await deleteFile('products', 'images/old.png');
```

Removes the file at the specified path from the bucket. The function resolves once the object is deleted.

## replaceFile

```js
const url = await replaceFile('products', file, oldUrl, 'images');
```

Deletes the previous file if provided and uploads the new one in a single call. The old path can be a full public URL or a storage path. The function returns the public URL of the new file.

## downloadFile

```js
const blob = await downloadFile('products', 'images/photo.png');
```

Downloads the specified object from Supabase Storage and resolves with the Blob data.
