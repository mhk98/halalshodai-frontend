/**
 * Logos are often uploaded as a square with a wide plain margin, which makes them tiny in the
 * header. For Cloudinary images, ask Cloudinary to trim that margin (e_trim); other URLs are
 * returned unchanged.
 */
export function trimmedLogo(url: string) {
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url) || url.includes('/e_trim')) return url;
  return url.replace('/image/upload/', '/image/upload/e_trim:10/');
}
