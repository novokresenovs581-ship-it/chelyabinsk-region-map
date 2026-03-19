
window.PHOTO_CACHE = {};

window.loadPhotos = async function(name){
  if(window.PHOTO_CACHE[name]) return window.PHOTO_CACHE[name];
  try{
    const res = await fetch('photos.json');
    const data = await res.json();
    const images = data[name]?.images || [];
    window.PHOTO_CACHE[name] = images;
    return images;
  }catch(e){
    return [];
  }
};

window.buildPhotoGallery = function(images, title){
  if(!images || !images.length){
    return `<div class="photo-empty">Фото пока не добавлены</div>`;
  }
  return `
    <div class="photo-main"><img src="${images[0]}" alt="${title}"></div>
    <div class="photo-strip">
      ${images.map(src => `<img src="${src}" alt="${title}">`).join('')}
    </div>
  `;
};
