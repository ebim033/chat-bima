/******** LOGIN DATA (UBAH DI SINI) ********/
const users = {
  "admin": "admin123",      // User 1 menjadi admin
  "genta": "genta456",      // Member
  "leo": "leo789",          // Member
  "reno": "reno012",        // Member
  "kay": "kay345",          // Member
  "yoga": "yoga678"         // Member
};

/******** LOGIN ********/
function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;

  if (users[u] && users[u] === p) {
    localStorage.setItem("chatUser", u);
    window.location.href = "chat.html";
  } else {
    document.getElementById("error").textContent = "Username atau Password salah!";
  }
}

/******** FIREBASE ********/
let messagesRef = null;
let storageRef = null;

const firebaseConfig = {
  apiKey: "AIzaSyD7kN9qyueYOkc456U1QEWemSZryKzOeSk",
  authDomain: "chat-76acf.firebaseapp.com",
  databaseURL: "https://chat-76acf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-76acf",
  storageBucket: "chat-76acf.firebasestorage.app",
  messagingSenderId: "432041937284",
  appId: "1:432041937284:web:863da20e5d50db1519b5d1"
};

if (typeof firebase !== "undefined") {
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  messagesRef = db.ref("privateChat");
  storageRef = firebase.storage();

  const user = localStorage.getItem("chatUser");
  
  window.onload = function () {
    // Hanya admin yang bisa melihat tombol hapus chat
    if (user !== "admin") {
      const btn = document.querySelector(".danger");
      if (btn) btn.style.display = "none";
    }
  };
  
  if (!user) window.location.href = "index.html";

  document.getElementById("userDisplay").textContent =
    "Login sebagai: " + user;

  window.sendMessage = function () {
    const input = document.getElementById("message");
    const text = input.value.trim();

    if (text !== "") {
      messagesRef.push({
        user: user,
        text: text,
        timestamp: new Date().toISOString(),
        type: 'text'
      });
      input.value = "";
    }
  };

  // Fungsi upload file (foto/video)
  window.uploadFile = function (file) {
    if (!file) return;
    
    // Validasi ukuran file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File terlalu besar! Maksimal 10MB");
      return;
    }
    
    // Validasi tipe file
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
      alert("Hanya gambar (JPEG, PNG, GIF, WebP) dan video (MP4, WebM, OGG) yang diizinkan!");
      return;
    }
    
    const timestamp = Date.now();
    const fileName = `chat_media/${user}_${timestamp}_${file.name}`;
    
    // Tampilkan indikator upload
    const uploadIndicator = document.createElement('div');
    uploadIndicator.className = 'upload-indicator';
    uploadIndicator.innerHTML = `
      <div class="upload-progress">
        <div class="upload-bar"></div>
        <span>Mengupload ${file.name}...</span>
      </div>
    `;
    document.getElementById("messages").appendChild(uploadIndicator);
    
    // Upload ke Firebase Storage
    const uploadTask = storageRef.ref(fileName).put(file);
    
    uploadTask.on('state_changed',
      (snapshot) => {
        // Progress bar
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        const progressBar = uploadIndicator.querySelector('.upload-bar');
        if (progressBar) {
          progressBar.style.width = progress + '%';
        }
      },
      (error) => {
        // Error handling
        console.error("Upload error:", error);
        alert("Gagal mengupload file: " + error.message);
        uploadIndicator.remove();
      },
      () => {
        // Upload selesai
        uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
          // Simpan ke database
          messagesRef.push({
            user: user,
            mediaUrl: downloadURL,
            mediaType: file.type.includes('image') ? 'image' : 'video',
            fileName: file.name,
            timestamp: new Date().toISOString(),
            type: 'media'
          });
          
          uploadIndicator.remove();
        });
      }
    );
  };

  // Event listener untuk file input
  document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message');
    const fileInput = document.getElementById('fileInput');
    const attachBtn = document.getElementById('attachBtn');
    
    if (attachBtn) {
      attachBtn.onclick = function() {
        fileInput.click();
      };
    }
    
    if (fileInput) {
      fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
          uploadFile(file);
          fileInput.value = ''; // Reset input
        }
      };
    }
    
    // Enter untuk send message
    if (messageInput) {
      messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }
  });
 const IMGBB_API_KEY = "PASTE_API_KEY_LU_DI_SINI";

const imageInput = document.getElementById("imageInput");

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        messagesRef.push({
          user: user,
          type: "image",
          url: data.data.url,
          time: Date.now(),
        });
      } else {
        alert("Upload gagal");
      }
    })
    .catch(() => {
      alert("Upload error");
    });

  imageInput.value = "";
});

}

/******** HAPUS CHAT ********/
function clearChat() {
  const user = localStorage.getItem("chatUser");

  // Hanya admin yang bisa menghapus chat
  if (user !== "admin") {
    alert("❌ Hanya admin yang dapat menghapus chat!");
    return;
  }

  const yakin = confirm("Yakin mau hapus semua chat? Hanya admin yang dapat melakukan ini.");
  if (yakin && messagesRef) {
    messagesRef.remove();
    document.getElementById("messages").innerHTML = "";
  }
}

function logout() {
  localStorage.removeItem("chatUser");
  window.location.href = "index.html";
}

function toggleMenu() {
  const menu = document.getElementById("menuPanel");
  menu.classList.toggle("hidden");
}

/******** THEME (DARK / LIGHT) ********/
function setTheme(mode) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(mode);
  localStorage.setItem("chatTheme", mode);
}

// Fungsi untuk membuka media modal
function openMediaModal(url, type) {
  const modal = document.createElement('div');
  modal.className = 'media-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    background: transparent;
    color: white;
    border: none;
    font-size: 30px;
    cursor: pointer;
    z-index: 1001;
  `;
  closeBtn.onclick = function() {
    modal.remove();
  };
  
  modal.appendChild(closeBtn);
  
  if (type === 'image') {
    const img = document.createElement('img');
    img.src = url;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
    `;
    modal.appendChild(img);
  } else if (type === 'video') {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.style.cssText = `
      max-width: 90%;
      max-height: 90%;
    `;
    modal.appendChild(video);
  }
  
  modal.onclick = function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  };
  
  document.body.appendChild(modal);
}

// auto load theme
const savedTheme = localStorage.getItem("chatTheme");
if (savedTheme) {
  document.body.classList.add(savedTheme);
} else {
  document.body.classList.add("light");
}

// Request permission untuk notifikasi
if ("Notification" in window) {
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}
const IMGBB_API_KEY = "0c609448fb975bdfdcec4286a6b03646";

const imageInput = document.getElementById("imageInput");

imageInput.addEventListener("change", function () {
  const file = imageInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        messagesRef.push({
          user: user,
          type: "image",
          url: data.data.url,
          time: Date.now(),
        });
      } else {
        alert("Upload gagal");
      }
    })
    .catch(() => {
      alert("Upload error");
    });

  imageInput.value = "";
});
