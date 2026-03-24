// ============================================
// PART 1: Lab Problem (Contact Form)
// ============================================

const contactForm = document.getElementById('contactForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submitBtn');
const contactList = document.getElementById('contactList');
const searchInput = document.getElementById('searchInput');

const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const phoneError = document.getElementById('phoneError');

// State Management
let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
let editingId = null;


function init() {
    renderContacts(contacts);
    contactForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);
}

function handleFormSubmit(e) {
    e.preventDefault();
    clearErrors();
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    
    // Validation
    let isValid = true;
    if (!name) {
        nameError.textContent = 'Name is required';
        isValid = false;
    }
    if (!email) {
        emailError.textContent = 'Email is required';
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = 'Please enter a valid email';
        isValid = false;
    }
    if (!phone) {
        phoneError.textContent = 'Phone number is required';
        isValid = false;
    }

    if (!isValid) return;

    if (editingId) {
        // Edit mode
        contacts = contacts.map(c => c.id === editingId ? { ...c, name, email, phone } : c);
        submitBtn.textContent = 'Add Contact';
        editingId = null;
    } else {
        // Add mode
        contacts.push({ id: Date.now().toString(), name, email, phone });
    }

    saveAndRender();
    contactForm.reset();
}

function deleteContact(id) {
    if (confirm('Are you sure you want to delete this contact?')) {
        contacts = contacts.filter(c => c.id !== id);
        if (editingId === id) {
            contactForm.reset();
            submitBtn.textContent = 'Add Contact';
            editingId = null;
            clearErrors();
        }
        saveAndRender();
    }
}

function editContact(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    
    nameInput.value = contact.name;
    emailInput.value = contact.email;
    phoneInput.value = contact.phone;
    editingId = id;
    
    submitBtn.textContent = 'Update Contact';
    clearErrors();
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Better UX on mobile
}

function handleSearch() {
    const query = searchInput.value.toLowerCase();
    const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.email.toLowerCase().includes(query)
    );
    renderContacts(filtered);
}

function renderContacts(data) {
    contactList.innerHTML = '';
    
    if (data.length === 0) {
        contactList.innerHTML = `<div class="empty-state">No contacts found.</div>`;
        return;
    }

    data.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'contact-item';
        
        // Anti-pattern fix: Use proper HTML escaping to prevent XSS (not explicitly requested but good practice)
        item.innerHTML = `
            <div class="contact-info">
                <strong>${escapeHTML(contact.name)}</strong>
                <span>${escapeHTML(contact.email)}</span>
                <span>${escapeHTML(contact.phone)}</span>
            </div>
            <div class="contact-actions">
                <button class="btn btn-sm btn-text" onclick="editContact('${contact.id}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteContact('${contact.id}')">Delete</button>
            </div>
        `;
        contactList.appendChild(item);
    });
}

function saveAndRender() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
    handleSearch(); // Keeps search filter active while saving
}

function clearErrors() {
    nameError.textContent = '';
    emailError.textContent = '';
    phoneError.textContent = '';
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Start
init();


// ============================================
// PART 2: Post Lab Questions (Output in console)
// ============================================

console.log('%c--- Post Lab Question 1: JSON Filter ---', 'color: #2563eb; font-weight: bold;');

const productsJSON = `[
    { "id": 1, "name": "Laptop", "price": 999.99 },
    { "id": 2, "name": "Mouse", "price": 25.50 },
    { "id": 3, "name": "Keyboard", "price": 75.00 },
    { "id": 4, "name": "Monitor", "price": 250.00 }
]`;

function processProducts(jsonString, minPrice) {
    try {
        const productsList = JSON.parse(jsonString);
        console.log("All Products:");
        productsList.forEach(p => console.log(`- ${p.name}: $${p.price}`));
        
        const filtered = productsList.filter(p => p.price >= minPrice);
        console.log(`\nFiltered Products (Price >= $${minPrice}):`);
        filtered.forEach(p => console.log(`- ${p.name}: $${p.price}`));
    } catch (e) {
        console.error("Error processing JSON", e);
    }
}
processProducts(productsJSON, 100);

// ============================================
// PART 3: Optional Scenario (Async/Await Fetch)
// ============================================

console.log('%c\n--- Optional: Async/Await Parallel Promises ---', 'color: #2563eb; font-weight: bold;');

function fetchProductDetails() {
    return new Promise(resolve => {
        setTimeout(() => resolve({ id: 101, name: "Headphones", specs: "Noise Cancelling" }), 1000);
    });
}

function fetchCustomerReviews() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(["Great sound!", "Battery life is amazing.", "A bit heavy."]);
        }, 1200);
    });
}

function fetchCustomerReviewsFails() {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error("Server timeout while fetching reviews.")), 1500);
    });
}

async function getProductPageData() {
    console.log("Fetching product data and reviews in parallel...");
    try {
        // Promise.all ensures both finish in parallel
        const [product, reviews] = await Promise.all([
            fetchProductDetails(),
            fetchCustomerReviews()
        ]);
        console.log("Successfully fetched both!");
        console.log("Product:", product);
        console.log("Reviews:", reviews);
    } catch (error) {
        console.error("Fetch failed:", error.message);
    }
}

async function getProductPageDataWithFailure() {
    console.log("\nFetching again, simulating a failure this time...");
    try {
        const [product, reviews] = await Promise.all([
            fetchProductDetails(),
            fetchCustomerReviewsFails() 
        ]);
    } catch (error) {
        // This catch block handles the failure of ANY promise in the array
        console.error("Handling fetch failure properly:", error.message);
    }
}

// Run the demonstration async IIFE
(async () => {
    await getProductPageData();
    await getProductPageDataWithFailure();
})();
