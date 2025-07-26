// ✅ Biến toàn cục lưu ảnh đã được resize để sử dụng khi upload
window.fileResized = null;

// 📷 Hiển thị ảnh preview và resize ảnh về kích thước nhẹ hơn
function showPreview() {
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];
  const preview = document.getElementById("previewImage");

  if (!file || !file.type.startsWith("image/")) {
    preview.style.display = "none";
    window.fileResized = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const MAX_WIDTH = 800;
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Hiển thị preview sau khi resize
      preview.src = canvas.toDataURL("image/jpeg", 0.8); // chất lượng 80%
      preview.style.display = "block";

      canvas.toBlob(blob => {
        window.fileResized = new File([blob], file.name, { type: "image/jpeg" });
      }, "image/jpeg", 0.8);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

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
