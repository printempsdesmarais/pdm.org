document.addEventListener('DOMContentLoaded', function() {
  const bgImage = document.querySelector('.bg-image');
  if (!bgImage) return;

  window.addEventListener('scroll', function() {
    const y = window.scrollY;
    const blur = Math.min(y / 100, 12); // max 12px
    bgImage.style.filter = `blur(${blur}px)`;
  });
});
