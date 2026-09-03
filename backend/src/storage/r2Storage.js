const crypto = require('crypto');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA;
const SLIDES_BUCKET = process.env.R2_BUCKET_SLIDES;
// Domain public (custom domain hoặc pub-xxxx.r2.dev) đã bật Public Access cho bucket media
const MEDIA_PUBLIC_BASE = (process.env.R2_MEDIA_PUBLIC_URL || '').replace(/\/$/, '');
const SLIDE_URL_TTL_SECONDS = parseInt(process.env.R2_SLIDE_URL_TTL || '90', 10);

function safeExt(originalname) {
  return path.extname(originalname || '') || '';
}

function randomName(prefix, originalname) {
  return `${prefix}${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt(originalname)}`;
}

/**
 * Lưu trên Cloudflare R2 (tương thích S3, KHÔNG tính phí băng thông ra) - dùng
 * khi đã khai báo đủ biến môi trường R2_*. Ảnh minh hoạ lưu ở bucket public,
 * phục vụ trực tiếp qua CDN. Trang PPT lưu ở bucket riêng (private), chỉ truy
 * cập được qua URL ký (presigned) sống ngắn hạn do server phát hành sau khi
 * đã xác thực JWT + phiên đăng nhập - giữ nguyên mức bảo mật như bản local.
 */
async function saveMedia(buffer, originalname, mimetype) {
  const key = randomName('media/', originalname);
  await client.send(new PutObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    CacheControl: 'public, max-age=31536000, immutable'
  }));
  return { url: `${MEDIA_PUBLIC_BASE}/${key}`, key };
}

async function saveSlidePage(slideId, buffer, originalname, mimetype) {
  const filename = randomName('page-', originalname);
  await client.send(new PutObjectCommand({
    Bucket: SLIDES_BUCKET,
    Key: `slides/${slideId}/${filename}`,
    Body: buffer,
    ContentType: mimetype
  }));
  return { key: filename };
}

/** Chuyển hướng (302) sang URL ký ngắn hạn - trình duyệt tải trực tiếp từ R2/CDN, không qua Node. */
async function sendSlidePage(res, slideId, key) {
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: SLIDES_BUCKET, Key: `slides/${slideId}/${key}` }),
    { expiresIn: SLIDE_URL_TTL_SECONDS }
  );
  res.set('Cache-Control', 'no-store');
  res.redirect(302, url);
  return true;
}

/**
 * File PowerPoint/tài liệu gốc của bộ bài giảng - lưu ở bucket slide (private),
 * chỉ giáo viên/admin tải lên và tải về được qua URL ký ngắn hạn (route tự
 * kiểm tra role trước khi phát hành). Mỗi bộ bài giảng chỉ giữ 1 file gốc.
 */
async function saveSlideSource(slideId, buffer, originalname, mimetype) {
  const filename = `source${safeExt(originalname)}`;
  await client.send(new PutObjectCommand({
    Bucket: SLIDES_BUCKET,
    Key: `slides/${slideId}/${filename}`,
    Body: buffer,
    ContentType: mimetype
  }));
  return { fileName: filename };
}

async function sendSlideSource(res, slideId, fileName, downloadName) {
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: SLIDES_BUCKET,
      Key: `slides/${slideId}/${fileName}`,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(downloadName || fileName)}"`
    }),
    { expiresIn: SLIDE_URL_TTL_SECONDS }
  );
  res.set('Cache-Control', 'no-store');
  res.redirect(302, url);
  return true;
}

module.exports = { mode: 'r2', saveMedia, saveSlidePage, sendSlidePage, saveSlideSource, sendSlideSource };
