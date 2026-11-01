import {
  cameraCaptureFilename,
  sanitizeUploadFilename,
  stripDataUrlPrefix,
  uploadFilename,
} from '@/lib/admin/knowledgeUpload';

describe('stripDataUrlPrefix', () => {
  it('removes the data URL header', () => {
    expect(stripDataUrlPrefix('data:image/jpeg;base64,abc123')).toBe('abc123');
  });

  it('returns the string unchanged when there is no comma', () => {
    expect(stripDataUrlPrefix('rawbase64')).toBe('rawbase64');
  });
});

describe('sanitizeUploadFilename', () => {
  it('keeps the basename and drops path segments', () => {
    expect(sanitizeUploadFilename('/tmp/my report (1).pdf')).toBe('my report (1).pdf');
  });

  it('replaces unsafe characters', () => {
    expect(sanitizeUploadFilename('weird$name%.txt')).toBe('weird_name_.txt');
  });
});

describe('uploadFilename', () => {
  it('uses a timestamped name for camera captures', () => {
    expect(uploadFilename({ name: 'IMG_0001.jpg' }, { fromCamera: true, now: 1_700_000_000_000 })).toBe(
      'photo-1700000000000.jpg',
    );
  });

  it('uses the sanitized original name for file picks', () => {
    expect(uploadFilename({ name: '../docs/statement.pdf' })).toBe('statement.pdf');
  });

  it('cameraCaptureFilename matches uploadFilename for camera', () => {
    const now = 42;
    expect(cameraCaptureFilename(now)).toBe(uploadFilename({ name: 'x' }, { fromCamera: true, now }));
  });
});
