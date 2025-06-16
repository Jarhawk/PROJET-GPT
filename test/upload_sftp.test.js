import { vi, test, expect } from 'vitest';

const connect = vi.fn();
const fastPut = vi.fn();
const end = vi.fn();
vi.mock('ssh2-sftp-client', () => ({
  default: vi.fn(() => ({ connect, fastPut, end }))
}));

process.env.SFTP_HOST = 'sftp.example.com';
process.env.SFTP_USER = 'user';
process.env.SFTP_PASS = 'pass';
process.env.SFTP_DIR = '/uploads';

test('uploads file to sftp', async () => {
  const { default: SftpClient } = await import('ssh2-sftp-client');
  const upload = (await import('../scripts/upload_sftp.js')).default;
  await upload('test.txt');
  expect(connect).toHaveBeenCalled();
  expect(fastPut).toHaveBeenCalledWith('test.txt', '/uploads/test.txt');
  expect(end).toHaveBeenCalled();
});
