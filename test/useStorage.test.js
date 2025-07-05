// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { beforeEach, vi, test, expect } from 'vitest';

const uploadMock = vi.fn(() => Promise.resolve({ error: null }));
const removeMock = vi.fn(() => Promise.resolve({ error: null }));
const downloadMock = vi.fn(() => Promise.resolve({ data: new Blob(['a']), error: null }));
const getPublicMock = vi.fn(() => ({ data: { publicUrl: '/new.png' } }));
const fromMock = vi.fn(() => ({
  upload: uploadMock,
  remove: removeMock,
  download: downloadMock,
  getPublicUrl: getPublicMock,
}));

vi.mock('@/lib/supabase', () => ({ supabase: { storage: { from: fromMock } } }));

let uploadFile, deleteFile, replaceFile, pathFromUrl, downloadFile;

beforeEach(async () => {
  ({ uploadFile, deleteFile, replaceFile, pathFromUrl, downloadFile } = await import('@/hooks/useStorage'));
  uploadMock.mockClear();
  removeMock.mockClear();
  downloadMock.mockClear();
  getPublicMock.mockClear();
  fromMock.mockClear();
});

test('uploadFile uploads and returns URL', async () => {
  const file = new File(['a'], 'a.txt');
  const url = await uploadFile('b', file, 'f');
  expect(fromMock).toHaveBeenCalledWith('b');
  expect(uploadMock).toHaveBeenCalled();
  expect(url).toBe('/new.png');
});

test('replaceFile deletes previous and uploads new file', async () => {
  const file = new File(['b'], 'b.txt');
  const url = await replaceFile('b', file, 'http://x.supabase.co/storage/v1/object/public/b/old.png', 'f');
  expect(removeMock).toHaveBeenCalledWith(['old.png']);
  expect(uploadMock).toHaveBeenCalled();
  expect(url).toBe('/new.png');
});

test('deleteFile removes path', async () => {
  await deleteFile('b', 'to/remove.png');
  expect(fromMock).toHaveBeenCalledWith('b');
  expect(removeMock).toHaveBeenCalledWith(['to/remove.png']);
});

test('pathFromUrl extracts storage path', () => {
  const path = pathFromUrl('https://x.supabase.co/storage/v1/object/public/b/img.png');
  expect(path).toBe('img.png');
});

test('downloadFile downloads blob', async () => {
  const blob = await downloadFile('b', 'file.txt');
  expect(fromMock).toHaveBeenCalledWith('b');
  expect(downloadMock).toHaveBeenCalledWith('file.txt');
  expect(blob instanceof Blob).toBe(true);
});
