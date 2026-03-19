
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
