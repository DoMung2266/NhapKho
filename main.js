async function fetchJSON(token) {
  const res = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    }
  });
  if (!res.ok) return { data: [], sha: null };
  const json = await res.json();
  const decoded = atob(json.content);
  return {
    data: JSON.parse(decoded),
    sha: json.sha
  };
}

async function saveJSON(token, newData, sha) {
  const encoded = new TextEncoder().encode(JSON.stringify(newData, null, 2));
  const base64 = btoa(String.fromCharCode(...encoded));
  const payload = {
    message: `Cập nhật ${newData.length} sản phẩm`,
    content: base64,
    ...(sha ? { sha } : {})
  };

  return fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json"
    },
    body: JSON.stringify(payload)
  });
}

function showPreview() {
  const file = document.getElementById("imageInput").files[0];
  const preview = document.getElementById("previewImage");

  if (!file) {
    preview.style.display = "none";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    preview.src = e.target.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

async function saveProduct() {
  const token = document.getElementById("tokenInput").value.trim();
  const maSo = document.getElementById("maSoInput").value.trim();
  const hang = document.getElementById("hangInput").value.trim();
  const quyCach = document.getElementById("quyCachInput").value.trim();
  const loaiGo = document.getElementById("loaiGoInput").value.trim();
  const file = document.getElementById("imageInput").files[0];
  const preview = document.getElementById("previewImage");
  const imageStatus = document.getElementById("imageStatus");
  const jsonStatus = document.getElementById("jsonStatus");

  if (!token || !maSo || !hang) {
    imageStatus.textContent = "";
    jsonStatus.textContent = "⚠️ Vui lòng nhập đầy đủ Mã Số, Hãng và Token.";
    jsonStatus.style.color = "red";
    return;
  }

  imageStatus.textContent = "";
  jsonStatus.textContent = "⏳ Đang xử lý...";
  jsonStatus.style.color = "orange";

  let imageLink = "";

  try {
    // 📤 Upload ảnh với tên an toàn
    if (file) {
      const ext = file.name.split(".").pop();
      const folder = `images/${hang}/`;
      let baseName = maSo;
      let imgPath = `${folder}${baseName}.${ext}`;
      let imgUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${imgPath}`;
      let suffix = 1;

      // 🔁 Kiểm tra trùng tên ảnh ➜ thêm số nếu cần
      while (true) {
        const checkRes = await fetch(imgUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (checkRes.status === 404) break;
        baseName = `${maSo} (${suffix})`;
        imgPath = `${folder}${baseName}.${ext}`;
        imgUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${imgPath}`;
        suffix++;
      }

      const reader = new FileReader();
      const base64 = await new Promise(resolve => {
        reader.onload = e => resolve(e.target.result.split(",")[1]);
        reader.readAsDataURL(file);
      });

      const resImg = await fetch(imgUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        },
        body: JSON.stringify({
          message: `Upload ảnh ${baseName}`,
          content: base64
        })
      });

      if (resImg.ok) {
        imageLink = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${imgPath}`;
        imageStatus.textContent = "✅ Ảnh đã upload thành công!";
        imageStatus.style.color = "green";
      } else {
        imageStatus.textContent = "❌ Upload ảnh thất bại.";
        imageStatus.style.color = "red";
        return;
      }
    }

    // 📋 Tải dữ liệu & kiểm tra mã số
    const { data, sha } = await fetchJSON(token);
    const index = data.findIndex(item => item.maSo === maSo);

    if (index >= 0) {
      const existing = data[index];
      let updated = false;

      if (!existing.hang && hang) {
        existing.hang = hang;
        updated = true;
      }
      if (!existing.quyCach && quyCach) {
        existing.quyCach = quyCach;
        updated = true;
      }
      if (!existing.loaiGo && loaiGo) {
        existing.loaiGo = loaiGo;
        updated = true;
      }
      if (!existing.hinh && imageLink) {
        existing.hinh = imageLink;
        updated = true;
      }

      if (updated) {
        data[index] = existing;
        const resSave = await saveJSON(token, data, sha);
        if (resSave.ok) {
          jsonStatus.textContent = "✅ Đã cập nhật thông tin cho mã số đã tồn tại!";
          jsonStatus.style.color = "green";
        } else {
          const err = await resSave.json();
          jsonStatus.textContent = `❌ Cập nhật thất bại: ${err.message || "Không rõ lỗi"}`;
          jsonStatus.style.color = "red";
        }
      } else {
        jsonStatus.textContent = "⚠️ Mã số đã đầy đủ thông tin, không cần cập nhật.";
        jsonStatus.style.color = "orange";
      }

      return;
    }

    // 🆕 Ghi sản phẩm mới nếu chưa tồn tại
    const newItem = {
      maSo,
      hang,
      hinh: imageLink,
      quyCach,
      loaiGo,
      timestamp: new Date().toISOString()
    };

    const combined = data.concat(newItem);
    const resSave = await saveJSON(token, combined, sha);

    if (resSave.ok) {
      jsonStatus.textContent = "✅ Thông tin sản phẩm đã được ghi!";
      jsonStatus.style.color = "green";
    } else {
      const err = await resSave.json();
      jsonStatus.textContent = `❌ Ghi sản phẩm thất bại: ${err.message || "Không rõ lỗi"}`;
      jsonStatus.style.color = "red";
    }

  } catch (error) {
    console.error("❌ Lỗi xử lý:", error);
    jsonStatus.textContent = "❌ Có lỗi khi xử lý GitHub.";
    jsonStatus.style.color = "red";
  }
}
