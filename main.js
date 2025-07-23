// ⚙️ Cấu hình GitHub API
const GITHUB_USERNAME = "your-github-username";
const GITHUB_REPO = "product-storage"; // Tên repo
const GITHUB_FILEPATH = "products.json"; // Đường dẫn file
const GITHUB_TOKEN = "ghp_xxx..."; // Token cá nhân

const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILEPATH}`;

document.getElementById("productForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const price = parseInt(document.getElementById("price").value, 10);
  const quantity = parseInt(document.getElementById("quantity").value, 10);
  const image = document.getElementById("image").value.trim();

  const newItem = {
    name,
    description,
    price,
    quantity,
    image,
    timestamp: new Date().toISOString()
  };

  const statusDiv = document.getElementById("status");
  statusDiv.textContent = "⏳ Đang lưu sản phẩm lên GitHub...";

  try {
    // 📥 Lấy nội dung hiện tại file products.json
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    });

    const fileData = await res.json();
    let currentContent = [];

    if (res.ok && fileData.content) {
      const decoded = atob(fileData.content);
      currentContent = JSON.parse(decoded);
    }

    // ➕ Thêm sản phẩm mới vào danh sách
    currentContent.push(newItem);

    // 🔄 Mã hóa lại dữ liệu thành base64
    const updatedContent = btoa(JSON.stringify(currentContent, null, 2));

    // ✏️ Ghi file mới lên GitHub
    const updateRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `Thêm sản phẩm: ${name}`,
        content: updatedContent,
        sha: fileData.sha // cần để GitHub xác nhận phiên bản
      })
    });

    if (updateRes.ok) {
      statusDiv.textContent = "✅ Sản phẩm đã lưu thành công lên GitHub!";
      document.getElementById("productForm").reset();
    } else {
      const err = await updateRes.json();
      statusDiv.textContent = `❌ Lỗi ghi file: ${err.message}`;
    }

  } catch (error) {
    console.error(error);
    statusDiv.textContent = "❌ Có lỗi xảy ra khi ghi lên GitHub.";
  }
});
