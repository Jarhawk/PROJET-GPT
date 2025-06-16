import SftpClient from 'ssh2-sftp-client';

export default async function upload(fileArg) {
  const file = fileArg || process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/upload_sftp.js <file>');
    process.exit(1);
  }
  const client = new SftpClient();
  const {
    SFTP_HOST,
    SFTP_PORT = 22,
    SFTP_USER,
    SFTP_PASS,
    SFTP_DIR = '/'
  } = process.env;
  try {
    await client.connect({ host: SFTP_HOST, port: Number(SFTP_PORT), username: SFTP_USER, password: SFTP_PASS });
    const remotePath = `${SFTP_DIR}/${file.split('/').pop()}`;
    await client.fastPut(file, remotePath);
    console.log(`Uploaded ${file} to ${remotePath}`);
  } finally {
    client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  upload();
}
