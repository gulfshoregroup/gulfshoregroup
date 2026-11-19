// Home page fix #4 — stop preloading the blog-card photos.
// Remove `priority`, render at real size, let them lazy-load (default).
<Image
  src={post.image}
  alt={post.title}
  width={400}
  height={260}
  sizes="(max-width: 768px) 100vw, 400px"
/>
