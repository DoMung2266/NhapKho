// ✅ Biến toàn cục lưu ảnh đã được resize để sử dụng khi upload
window.fileResized = null;



// 🗑 Xóa ảnh đã chọn và reset trạng thái
function clearImage() {
  const imageInput = document.getElementById("imageInput");
  const preview = document.getElementById("previewImage");
  const imageStatus = document.getElementById("imageStatus");

  imageInput.value = "";
  preview.src = "";
  preview.style.display = "none";
  imageStatus.textContent = "🗑 Ảnh đã được xoá.";
  imageStatus.style.color = "gray";
  window.fileResized = null;
}

function resizeImage(file, maxWidth, maxHeight, callback) {
  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(callback, 'image/jpeg', 0.8);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}
