const firebaseConfig = {
    apiKey: "AIzaSyAdRm7tPX0GQ6akhD8z6qj-Uq5JoGkvrfM",
    authDomain: "helloapp-4608d.firebaseapp.com",
    projectId: "helloapp-4608d",
    storageBucket: "helloapp-4608d.firebasestorage.app",
    databaseURL: "https://helloapp-4608d-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const workerPhone = window.intlTelInput(document.querySelector("#upd-phone"), {
    initialCountry: "kw",
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
});

const reqPhoneInput = window.intlTelInput(document.querySelector("#req-phone"), {
    initialCountry: "kw",
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
});

let allWorkers = [];
let isSignUp = false;
let selectedDays = [];

document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const day = btn.getAttribute('data-day');
        if (selectedDays.includes(day)) {
            selectedDays = selectedDays.filter(d => d !== day);
        } else {
            selectedDays.push(day);
        }
    });
});

window.closeAuth = () => document.getElementById('auth-overlay').style.display = 'none';

window.toggleAuthMode = () => {
    isSignUp = !isSignUp;
    document.getElementById('auth-title').innerText = isSignUp ? "Create Account" : "Login";
    document.getElementById('toggle-text').innerText = isSignUp ? "Already have an account? Login" : "Need an account? Sign Up";
};

window.handleNavClick = () => {
    if (!auth.currentUser) {
        document.getElementById('auth-overlay').style.display = 'flex';
    }
};

window.executeAuth = () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    if (isSignUp) {
        auth.createUserWithEmailAndPassword(email, pass)
            .then(() => { closeAuth(); })
            .catch(e => document.getElementById('auth-error').innerText = e.message);
    } else {
        auth.signInWithEmailAndPassword(email, pass)
            .then(() => closeAuth())
            .catch(e => document.getElementById('auth-error').innerText = "Login failed.");
    }
};

function loadWorkerProfile(uid) {
    db.ref('workers/' + uid).once('value', snap => {
        const w = snap.val();
        if (w) {
            document.getElementById('upd-name').value = w.name || "";
            document.getElementById('upd-gender').value = w.gender || "Female";
            document.getElementById('upd-nationality').value = w.nationality || "Filipino";
            document.getElementById('upd-skill').value = w.skill || "House Cleaning";
            document.getElementById('upd-workType').value = w.workType || "Full-time";
            document.getElementById('upd-location').value = w.location || "Salmiya";
            document.getElementById('upd-price').value = w.price || "";
            document.getElementById('upd-hours').value = w.availableHours || "";
            workerPhone.setNumber(w.phone || "");

            selectedDays = w.availableDays || [];
            document.querySelectorAll('.day-btn').forEach(btn => {
                if (selectedDays.includes(btn.getAttribute('data-day'))) {
                    btn.classList.add('active');
                }
            });
        }
    });
}

document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const workerData = {
        name: document.getElementById('upd-name').value,
        gender: document.getElementById('upd-gender').value,
        nationality: document.getElementById('upd-nationality').value,
        skill: document.getElementById('upd-skill').value,
        workType: document.getElementById('upd-workType').value,
        location: document.getElementById('upd-location').value,
        price: document.getElementById('upd-price').value,
        availableDays: selectedDays,
        availableHours: document.getElementById('upd-hours').value,
        phone: workerPhone.getNumber(),
        updatedAt: Date.now()
    };

    db.ref('workers/' + user.uid).set(workerData).then(() => {
        alert("Profile Updated Successfully!");
    }).catch(err => alert("Error: " + err.message));
});

window.removeListing = () => {
    if (confirm("Remove your listing from the marketplace?")) {
        db.ref('workers/' + auth.currentUser.uid).remove().then(() => {
            alert("Listing removed.");
            location.reload();
        });
    }
};

window.submitCustomRequest = () => {
    const phone = reqPhoneInput.getNumber();
    if (!reqPhoneInput.isValidNumber()) return alert("Please enter a valid phone number.");

    const requestData = {
        category: document.getElementById('req-skill').value,
        nationality: document.getElementById('req-nation').value,
        gender: document.getElementById('req-gender').value,
        workType: document.getElementById('req-type').value,
        schedule: document.getElementById('req-schedule').value,
        description: document.getElementById('req-description').value,
        contact: phone,
        timestamp: Date.now()
    };

    db.ref('customRequests').push(requestData).then(() => {
        alert("Request submitted! We will contact you soon.");
        document.getElementById('req-schedule').value = "";
        document.getElementById('req-description').value = "";
        document.getElementById('req-phone').value = "";
    }).catch(err => alert("Error: " + err.message));
};

db.ref('workers').on('value', snap => {
    allWorkers = [];
    snap.forEach(child => {
        let worker = child.val();
        worker.id = child.key;
        allWorkers.push(worker);
    });
    renderWorkers(allWorkers);
});

function renderWorkers(data) {
    const grid = document.getElementById('workerList');
    grid.innerHTML = data.length ? "" : "<p style='grid-column: 1/-1; text-align:center;'>No listings match your search.</p>";
    data.forEach(w => {
        const dayHtml = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].map(d => {
            const active = w.availableDays && w.availableDays.includes(d) ? 'active' : '';
            return `<span class="day-tag ${active}">${d}</span>`;
        }).join('');

        grid.innerHTML += `
                    <div class="worker-card">
                        <div style="display:flex; justify-content:space-between; align-items: flex-start; gap: 10px;">
                            <h3 style="margin:0; font-size: 1.1rem;">${w.name}</h3>
                            <span class="tag" style="white-space: nowrap;">${w.skill}</span>
                            
                        </div>
                        <p style="font-size:0.85rem; color:#666; margin: 10px 0;">
                            <i class="fa-solid fa-earth-americas"></i> ${w.nationality} • <i class="fa-solid fa-clock"></i> ${w.workType}
                        </p>
                        <p style="font-size:0.85rem; color:#666; margin-bottom: 15px;">
                            <i class="fa-solid fa-location-dot"></i> ${w.location}• <i class="fa-solid fa-person"></i> ${w.gender}
                        </p>
                        <div style="border-top: 1px solid #eee; padding-top: 10px;">
                            <div style="margin-bottom:8px;">${dayHtml}</div>
                            <p style="font-size:0.75rem; color:#888;"><i class="fa-regular fa-clock"></i> ${w.availableHours || 'Contact for hours'}</p>
                            <p style="font-size:0.75rem; color:#888;"><i class="fa-solid fa-money-bill"></i> ${w.price ? w.price + ' KWD/month' : 'Contact for price'}</p>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:15px;">
                            <a href="tel:${w.phone}" class="btn-main" style="background:var(--dark)"><i class="fa-solid fa-phone"></i> Call</a>
                            <a href="https://wa.me/${w.phone ? w.phone.replace('+', '') : ''}" target="_blank" class="btn-main" style="background:var(--whatsapp)"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>
                        </div>
                    </div>`;
            });
        }

window.filterWorkers = () => {
    const nameQ = document.getElementById('search-name').value.toLowerCase();
    const skillQ = document.getElementById('filter-skill').value;
    const nationQ = document.getElementById('filter-nation').value;
    const locQ = document.getElementById('filter-loc').value;
    const genQ = document.getElementById('filter-gender').value;

    const filtered = allWorkers.filter(w => {
        return (w.name?.toLowerCase().includes(nameQ)) &&
            (skillQ === "" || w.skill === skillQ) &&
            (nationQ === "" || w.nationality === nationQ) &&
            (genQ === "" || w.gender === genQ) &&
            (locQ === "" || w.location === locQ);
    });
    renderWorkers(filtered);
};

window.logout = () => auth.signOut().then(() => location.reload());

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('nav-btn-main').classList.add('hidden');
        document.getElementById('nav-btn-logout').classList.remove('hidden');
        document.getElementById('profile-section').classList.remove('hidden');
        loadWorkerProfile(user.uid);
    } else {
        document.getElementById('nav-btn-main').innerText = "Login";
        document.getElementById('nav-btn-logout').classList.add('hidden');
        document.getElementById('profile-section').classList.add('hidden');
    }
});

window.scrollToMarketplace = () => {
    document.getElementById('marketplace-view').scrollIntoView({ behavior: 'smooth' });
}