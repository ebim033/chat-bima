/**************** FIREBASE CONFIG ****************/
const firebaseConfig = {
  apiKey: "AIzaSyD7kN9qyueYOkc456U1QEWemSZryKzOeSk",
  authDomain: "chat-76acf.firebaseapp.com",
  databaseURL:
    "https://chat-76acf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-76acf",
  messagingSenderId: "432041937284",
  appId: "1:432041937284:web:863da20e5d50db1519b5d1",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/**************** ADMIN CONFIG ****************/
/* 👉 UBAH USERNAME DI SINI */
const ADMIN_USERS = ["admin", "owner", "bimma033"];

/**************** REGISTER / LOGIN ****************/
let isRegister = false;

function toggleForm() {
  isRegister = !isRegister;
  document.getElementById("formTitle").innerText = isRegister
    ? "Register"
    : "Login";
  document.querySelector("button").innerText = isRegister
    ? "Daftar"
    : "Masuk";
  document.getElementById("toggleText").innerText = isRegister
    ? "Sudah punya akun?"
    : "Belum punya akun?";
  document.getElementById("error").innerText = "";
}

function handleSubmit() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const error = document.getElementById("error");

  if (!username || !password) return;

  if (username.length < 3)
    return (error.innerText = "Username minimal 3 karakter");
  if (username.includes(" "))
    return (error.innerText = "Username tidak boleh pakai spasi");
  if (password.length < 6)
    return (error.innerText = "Password minimal 6 karakter");

  const userRef = db.ref("users/" + username);

  if (isRegister) {
    // REGISTER (ADMIN TIDAK BISA DIDAFTARKAN)
    if (ADMIN_USERS.includes(username)) {
      return (error.innerText = "Username ini tidak bisa didaftarkan");
    }

    userRef.once("value", (snap) => {
      if (snap.exists()) {
        error.innerText = "Username sudah digunakan";
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
        error.innerText = "User tidak ditemukan";
      } else if (snap.val().password !== password) {
        error.innerText = "Password salah";
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

if (currentUser && document.getElementById("messages")) {
  const isAdmin = ADMIN_USERS.includes(currentUser);

  document.getElementById("userDisplay").innerText =
    "Login sebagai: " + currentUser + (isAdmin ? " 👑" : "");

  // SEMBUNYIKAN TOMBOL HAPUS JIKA BUKAN ADMIN
  if (!isAdmin) {
    const btn = document.querySelector(".danger");
    if (btn) btn.style.display = "none";
  }

  // KIRIM PESAN
  window.sendMessage = function () {
    const input = document.getElementById("message");
    const text = input.value.trim();
    if (!text) return;

    messagesRef.push({
      user: currentUser,
      text,
      timestamp: Date.now(),
      type: "text",
    });

    input.value = "";
  };

  // TERIMA PESAN REALTIME
  messagesRef.limitToLast(100).on("child_added", (snap) => {
    const msg = snap.val();
    const messagesDiv = document.getElementById("messages");

    const wrapper = document.createElement("div");
    wrapper.className =
      "msg-wrapper " + (msg.user === currentUser ? "right" : "left");

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = `<strong>${msg.user}</strong><br>${msg.text}`;

    wrapper.appendChild(bubble);
    messagesDiv.appendChild(wrapper);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

/**************** ADMIN: HAPUS SEMUA CHAT ****************/
function clearChat() {
  if (!ADMIN_USERS.includes(currentUser)) {
    alert("❌ Hanya admin yang bisa hapus chat");
    return;
  }

  if (confirm("Yakin mau hapus semua chat?")) {
    messagesRef.remove();
    document.getElementById("messages").innerHTML = "";
  }
}

/**************** MENU & LOGOUT ****************/
function toggleMenu() {
  document.getElementById("menuPanel").classList.toggle("hidden");
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

document.body.classList.add(localStorage.getItem("chatTheme") || "light");

/**************** ENTER TO SEND ****************/
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("message");
  if (input) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });
    input.focus();
  }
});
