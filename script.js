/**************** FIREBASE CONFIG ****************/
const firebaseConfig = {
  apiKey: "AIzaSyD7kN9qyueYOkc456U1QEWemSZryKzOeSk",
  authDomain: "chat-76acf.firebaseapp.com",
  databaseURL: "https://chat-76acf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-76acf",
  messagingSenderId: "432041937284",
  appId: "1:432041937284:web:863da20e5d50db1519b5d1",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/**************** ADMIN CONFIG ****************/
const ADMIN_USERS = ["admin", "owner", "bima033"];

/**************** REGISTER / LOGIN ****************/
let isRegister = false;

function toggleForm() {
  isRegister = !isRegister;
  
  const formTitle = document.getElementById("formTitle");
  const submitBtn = document.querySelector("button");
  const toggleText = document.getElementById("toggleText");
  
  if (formTitle) formTitle.innerText = isRegister ? "Register" : "Login";
  if (submitBtn) submitBtn.innerText = isRegister ? "Daftar" : "Masuk";
  if (toggleText) toggleText.innerText = isRegister ? "Sudah punya akun?" : "Belum punya akun?";
  
  const error = document.getElementById("error");
  if (error) error.innerText = "";
}

function handleSubmit() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const error = document.getElementById("error");

  if (!username || !password) {
    if (error) error.innerText = "Harap isi username dan password";
    return;
  }

  if (username.length < 3) {
    if (error) error.innerText = "Username minimal 3 karakter";
    return;
  }
  
  if (username.includes(" ")) {
    if (error) error.innerText = "Username tidak boleh pakai spasi";
    return;
  }
  
  if (password.length < 6) {
    if (error) error.innerText = "Password minimal 6 karakter";
    return;
  }

  const userRef = db.ref("users/" + username);

  if (isRegister) {
    // REGISTER
    if (ADMIN_USERS.includes(username)) {
      if (error) error.innerText = "Username ini tidak bisa didaftarkan";
      return;
    }

    userRef.once("value", (snap) => {
      if (snap.exists()) {
        if (error) error.innerText = "Username sudah digunakan";
      } else {
        userRef.set({
          password,
          role: "member",
          createdAt: Date.now(),
        });
        localStorage.setItem("chatUser", username);
        window.location.href = "chat.html";
      }
    });
  } else {
    // LOGIN
    userRef.once("value", (snap) => {
      if (!snap.exists()) {
        if (error) error.innerText = "User tidak ditemukan";
      } else if (snap.val().password !== password) {
        if (error) error.innerText = "Password salah";
      } else {
        localStorage.setItem("chatUser", username);
        window.location.href = "chat.html";
      }
    });
  }
}

/**************** CHAT SYSTEM ****************/
const currentUser = localStorage.getItem("chatUser");
const messagesRef = db.ref("privateChat");

function initializeChat() {
  if (!currentUser) {
    // Jika belum login, redirect ke index.html
    if (window.location.pathname.includes("chat.html")) {
      setTimeout(() => {
        window.location.href = "index.html";
      }, 500);
    }
    return;
  }

  const userDisplay = document.getElementById("userDisplay");
  const messagesDiv = document.getElementById("messages");
  
  if (!userDisplay || !messagesDiv) return;

  const isAdmin = ADMIN_USERS.includes(currentUser);
  
  // Tampilkan username
  userDisplay.innerText = currentUser + (isAdmin ? " 👑" : "");
  
  // Sembunyikan tombol hapus jika bukan admin
  const clearBtn = document.querySelector(".danger");
  if (clearBtn && !isAdmin) {
    clearBtn.style.display = "none";
  }

  // Load existing messages
  messagesRef.limitToLast(100).once("value", (snapshot) => {
    messagesDiv.innerHTML = "";
    if (!snapshot.exists()) {
      messagesDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">Mulai percakapan pertama!</div>';
    } else {
      snapshot.forEach((childSnapshot) => {
        addMessageToDOM(childSnapshot.val(), childSnapshot.key);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  });

  // Listen for new messages
  messagesRef.limitToLast(100).on("child_added", (snapshot) => {
    addMessageToDOM(snapshot.val(), snapshot.key);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

function addMessageToDOM(msg, key) {
  const messagesDiv = document.getElementById("messages");
  if (!messagesDiv) return;

  const isOwnMessage = msg.user === currentUser;
  
  const wrapper = document.createElement("div");
  wrapper.className = "msg-wrapper " + (isOwnMessage ? "right" : "left");
  wrapper.setAttribute("data-id", key);

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  
  const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  bubble.innerHTML = `
    <span class="msg-user">${msg.user}${ADMIN_USERS.includes(msg.user) ? ' 👑' : ''}</span>
    <span class="msg-time">${time}</span><br>
    ${msg.text}
  `;

  wrapper.appendChild(bubble);
  messagesDiv.appendChild(wrapper);
  
  // Hapus welcome message jika ada
  const welcomeMsg = messagesDiv.querySelector('div[style*="text-align:center"]');
  if (welcomeMsg && messagesDiv.children.length > 1) {
    welcomeMsg.remove();
  }
}

window.sendMessage = function () {
  const input = document.getElementById("message");
  const text = input?.value.trim();
  
  if (!text || !currentUser) return;

  messagesRef.push({
    user: currentUser,
    text: text,
    timestamp: Date.now(),
    type: "text"
  });

  if (input) {
    input.value = "";
    input.focus();
  }
};

/**************** ADMIN: HAPUS SEMUA CHAT ****************/
function clearChat() {
  if (!ADMIN_USERS.includes(currentUser)) {
    alert("❌ Hanya admin yang bisa hapus chat");
    return;
  }

  if (confirm("Yakin mau hapus semua chat?")) {
    messagesRef.remove()
      .then(() => {
        const messagesDiv = document.getElementById("messages");
        if (messagesDiv) {
          messagesDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">Semua chat telah dihapus</div>';
        }
      })
      .catch((error) => {
        console.error("Error deleting chat:", error);
        alert("Gagal menghapus chat");
      });
  }
}

/**************** MENU & LOGOUT ****************/
function toggleMenu() {
  const menuPanel = document.getElementById("menuPanel");
  if (menuPanel) {
    menuPanel.classList.toggle("hidden");
  }
}

function logout() {
  localStorage.removeItem("chatUser");
  window.location.href = "index.html";
}

/**************** THEME ****************/
function setTheme(mode) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(mode);
  localStorage.setItem("chatTheme", mode);
}

/**************** ENTER TO SEND ****************/
document.addEventListener("DOMContentLoaded", () => {
  // Set theme from localStorage
  const savedTheme = localStorage.getItem("chatTheme") || "light";
  setTheme(savedTheme);
  
  // Initialize chat if on chat page
  if (window.location.pathname.includes("chat.html")) {
    if (!currentUser) {
      window.location.href = "index.html";
      return;
    }
    initializeChat();
  }

  // Enter to send message
  const messageInput = document.getElementById("message");
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
    messageInput.focus();
  }

  // Enter to submit login form
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  
  if (usernameInput && passwordInput) {
    const handleEnterKey = (e) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    };
    
    usernameInput.addEventListener("keypress", handleEnterKey);
    passwordInput.addEventListener("keypress", handleEnterKey);
  }
});