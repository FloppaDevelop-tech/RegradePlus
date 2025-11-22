// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJi1kmfyBYg8AxLl261cpm4Q6-ObkRSEo",
    authDomain: "regradeplus-82d6b.firebaseapp.com",
    projectId: "regradeplus-82d6b",
    storageBucket: "regradeplus-82d6b.appspot.com",
    messagingSenderId: "870087269668",
    appId: "1:870087269668:web:e1b431162c1ae85522e7b1",
    measurementId: "G-3DJWVKQQ1Q"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
    fetch("menu.html")
        .then(res => res.text())
        .then(html => {
            document.getElementById("menu-container").innerHTML = html;
            updateAdminLink();
        })
        .catch(err => console.error("โหลด menu ไม่ได้:", err));

    if (document.getElementById('history-list')) {
        loadHistory();
    }
});

// Menu Functions
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    if (menu) {
        menu.style.left = (menu.style.left === "0px") ? "-200px" : "0px";
    }
}

function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('uid');
        window.location.href = "index.html";
    }).catch(err => {
        console.error("Logout error:", err);
    });
}

// Email Validation
function checkEmailType(email) {
    if (email === "admin.regradeplus@gmail.com") {
        return "admin";
    } else if (email.endsWith("@taweethapisek.ac.th")) {
        return "student";
    } else {
        return "invalid";
    }
}

// Authentication Functions
function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('error-msg');

    const type = checkEmailType(email);

    if (type === "invalid") {
        errorMsg.textContent = "ใช้ email รร. หรือ admin เท่านั้น";
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            localStorage.setItem("uid", userCredential.user.uid);

            if (type === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "submit.html";
            }
        })
        .catch(error => {
            console.error(error);
            errorMsg.textContent = "เข้าสู่ระบบไม่สำเร็จ: " + error.message;
        });
}

function register() {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const errorMsg = document.getElementById('error-msg');

    const type = checkEmailType(email);
    
    if (type !== "student") {
        errorMsg.textContent = "ใช้ email รร. เท่านั้น (@taweethapisek.ac.th)";
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            localStorage.setItem("uid", userCredential.user.uid);
            window.location.href = "submit.html";
        })
        .catch(error => {
            console.error(error);
            errorMsg.textContent = "สมัครสมาชิกไม่สำเร็จ: " + error.message;
        });
}

// Submit Work Function - ใช้ Base64 (ไม่มี CORS issue)
async function submitWork() {
    const msg = document.getElementById("msg");

    const name = document.getElementById("name").value;
    const classRoom = document.getElementById("class").value;
    const studentId = document.getElementById("studentId").value;
    const subjectCode = document.getElementById("subjectCode").value;
    const subjectName = document.getElementById("subjectName").value;
    const year = document.getElementById("year").value;

    const files = document.getElementById("images").files;

    if (files.length === 0) {
        msg.textContent = "กรุณาเลือกรูปอย่างน้อย 1 รูป!";
        msg.style.color = "red";
        return;
    }

    const uid = localStorage.getItem("uid");
    if (!uid) {
        msg.textContent = "กรุณา login ก่อน";
        msg.style.color = "red";
        return;
    }

    // ตรวจสอบว่า user login อยู่จริง
    const currentUser = auth.currentUser;
    if (!currentUser) {
        msg.textContent = "Session หมดอายุ กรุณา login ใหม่";
        msg.style.color = "red";
        setTimeout(() => window.location.href = "index.html", 2000);
        return;
    }

    msg.textContent = "กำลังประมวลผลรูป...";
    msg.style.color = "blue";

    try {
        let imageData = [];

        // แปลงรูปเป็น Base64
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            msg.textContent = `กำลังประมวลผลรูปที่ ${i + 1}/${files.length}...`;
            
            // แปลงเป็น Base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            imageData.push({
                data: base64,
                name: file.name,
                type: file.type,
                size: file.size
            });
        }

        msg.textContent = "กำลังบันทึกข้อมูล...";

        // บันทึกลง Firestore
        await db.collection("submits").add({
            uid,
            name,
            classRoom,
            studentId,
            subjectCode,
            subjectName,
            year,
            images: imageData,
            imageCount: imageData.length,
            status: "รอตรวจ",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        msg.textContent = `ส่งงานสำเร็จ! (${imageData.length} รูป)`;
        msg.style.color = "green";
        
        // Clear form
        document.getElementById("name").value = "";
        document.getElementById("class").value = "";
        document.getElementById("studentId").value = "";
        document.getElementById("subjectCode").value = "";
        document.getElementById("subjectName").value = "";
        document.getElementById("year").value = "";
        document.getElementById("images").value = "";
    }
    catch (err) {
        console.error("Error:", err);
        msg.textContent = "เกิดข้อผิดพลาด: " + err.message;
        msg.style.color = "red";
    }
}

// Load History Function - รองรับทั้ง Base64 และ URL
function loadHistory() {
    const uid = localStorage.getItem('uid');
    const container = document.getElementById('history-list');

    if (!uid) {
        container.textContent = "กรุณา login ก่อน";
        return;
    }

    db.collection('submits')
        .where('uid', "==", uid)
        .orderBy('timestamp', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                container.textContent = "ยังไม่มีประวัติการส่งงาน";
                return;
            }

            container.innerHTML = "";
            snapshot.forEach(doc => {
                const data = doc.data();

                const div = document.createElement("div");
                div.style.margin = '10px 0';
                div.style.padding = '10px';
                div.style.border = '1px solid #ddd';
                div.style.borderRadius = '8px';

                const timestamp = data.timestamp ? 
                    new Date(data.timestamp.toDate()).toLocaleString('th-TH') : 
                    "ไม่ทราบเวลา";

                // สร้าง HTML สำหรับแสดงรูป
                let imagesHtml = "";
                if (data.images && data.images.length > 0) {
                    imagesHtml = '<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px;">';
                    
                    data.images.forEach((img, idx) => {
                        // รองรับทั้ง Base64 (object) และ URL (string)
                        const imgSrc = typeof img === 'string' ? img : img.data;
                        const imgName = typeof img === 'string' ? `รูปที่ ${idx + 1}` : img.name;
                        
                        imagesHtml += `
                            <div style="text-align: center;">
                                <img src="${imgSrc}" 
                                     style="max-width: 120px; max-height: 120px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; object-fit: cover;"
                                     onclick="window.open('${imgSrc}', '_blank')"
                                     title="คลิกเพื่อดูขนาดเต็ม">
                                <div style="font-size: 11px; color: #666; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${imgName}</div>
                            </div>
                        `;
                    });
                    imagesHtml += '</div>';
                }

                div.innerHTML = `
                    <b>${data.subjectName || "ไม่มีชื่อวิชา"}</b> (${data.subjectCode || "-"})<br>
                    ชื่อ: ${data.name || "-"}<br>
                    ชั้น: ${data.classRoom || "-"}<br>
                    รหัส นร.: ${data.studentId || "-"}<br>
                    ปีการศึกษา: ${data.year || "-"}<br>
                    สถานะ: <span style="color: orange; font-weight: bold;">${data.status || "รอตรวจ"}</span><br>
                    ส่งเมื่อ: ${timestamp}<br>
                    จำนวนรูป: ${data.imageCount || data.images.length} รูป
                    ${imagesHtml}
                `;
                container.appendChild(div);
            });
        })
        .catch(err => {
            console.error(err);
            container.textContent = "โหลดข้อมูลไม่ได้: " + err.message;
        });
}

// Admin Link Management
function updateAdminLink() {
    auth.onAuthStateChanged(user => {
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
            if (user && user.email === "admin.regradeplus@gmail.com") {
                adminLink.style.display = "block";
            } else {
                adminLink.style.display = "none";
            }
        }
    });
}

updateAdminLink();