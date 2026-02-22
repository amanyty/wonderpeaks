/* ================================================
   WONDERPEAKS ADMIN PANEL - JavaScript
   Supabase Integration
   ================================================ */

// ---- SUPABASE CONFIG ----
const SUPABASE_URL = 'https://fcxatqillzskuqyaubws.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjeGF0cWlsbHpza3VxeWF1YndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NDQ1MzksImV4cCI6MjA4NzMyMDUzOX0.ZtaN4zzqi93Ha_x1jnGvk8z72lnD6A41asIuxvLE4II';

// Admin credentials (hardcoded for simplicity)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'wanderpeaks2026';

// Initialize Supabase client
let supabaseClient;

function initSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
    }
    console.error('Supabase client library not loaded');
    return false;
}

// ---- STATE ----
let currentSection = 'dashboard';
let currentEditId = null;
let currentEditType = null;
let packageHighlights = [];

// ---- INIT ----
document.addEventListener('DOMContentLoaded', function () {
    try { initSupabase(); } catch (e) { console.error('Supabase init failed:', e); }
    checkSession();
    setupEventListeners();
});

// ---- AUTH ----
function checkSession() {
    const isLoggedIn = sessionStorage.getItem('wp_admin_logged_in');
    if (isLoggedIn === 'true') {
        showAdmin();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminLayout').classList.remove('active');
}

function showAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminLayout').classList.add('active');
    if (!supabaseClient) { try { initSupabase(); } catch (e) { } }
    loadDashboard();
}

function handleLogin(e) {
    if (e) e.preventDefault();
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem('wp_admin_logged_in', 'true');
        errorEl.style.display = 'none';
        showAdmin();
    } else {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Invalid credentials. Please try again.';
    }
    return false;
}

function handleLogout() {
    sessionStorage.removeItem('wp_admin_logged_in');
    showLogin();
}

// ---- EVENT LISTENERS ----
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Sidebar navigation
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            navigateTo(item.dataset.section);
        });
    });

    // Mobile menu
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', toggleMobileSidebar);
    }

    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', toggleMobileSidebar);
    }

    // Modal close
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAllModals();
        });
    });

    // Image preview
    document.querySelectorAll('.img-url-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const preview = e.target.closest('.form-group').querySelector('.image-preview');
            if (preview) {
                if (e.target.value) {
                    preview.src = e.target.value;
                    preview.classList.add('visible');
                    preview.onerror = () => preview.classList.remove('visible');
                } else {
                    preview.classList.remove('visible');
                }
            }
        });
    });
}

// ---- NAVIGATION ----
function navigateTo(section) {
    currentSection = section;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');

    // Update header title
    const titles = {
        dashboard: 'Dashboard',
        enquiries: 'Contact Enquiries',
        testimonials: 'Testimonials',
        packages: 'Destination Packages'
    };
    document.getElementById('sectionTitle').textContent = titles[section] || 'Dashboard';

    // Show/hide sections
    document.querySelectorAll('.data-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');

    // Load data
    switch (section) {
        case 'dashboard': loadDashboard(); break;
        case 'enquiries': loadEnquiries(); break;
        case 'testimonials': loadTestimonials(); break;
        case 'packages': loadPackages(); break;
    }

    // Close mobile sidebar
    document.getElementById('adminSidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
}

function toggleMobileSidebar() {
    document.getElementById('adminSidebar')?.classList.toggle('open');
    document.getElementById('sidebarOverlay')?.classList.toggle('active');
}

// ---- DASHBOARD ----
async function loadDashboard() {
    try {
        const [enquiriesRes, testimonialsRes, packagesRes] = await Promise.all([
            supabaseClient.from('enquiries').select('*', { count: 'exact' }),
            supabaseClient.from('testimonials').select('*', { count: 'exact' }),
            supabaseClient.from('packages').select('*', { count: 'exact' })
        ]);

        const enquiries = enquiriesRes.data || [];
        const newCount = enquiries.filter(e => e.status === 'new').length;

        document.getElementById('statEnquiries').textContent = enquiries.length;
        document.getElementById('statTestimonials').textContent = (testimonialsRes.data || []).length;
        document.getElementById('statPackages').textContent = (packagesRes.data || []).length;
        document.getElementById('statNewEnquiries').textContent = newCount;

        // Update nav badge
        const badge = document.getElementById('enquiriesBadge');
        if (badge) {
            badge.textContent = newCount;
            badge.style.display = newCount > 0 ? 'inline' : 'none';
        }
    } catch (err) {
        console.error('Dashboard load error:', err);
    }
}

// ---- ENQUIRIES ----
async function loadEnquiries() {
    const container = document.getElementById('enquiriesTableBody');
    const emptyState = document.getElementById('enquiriesEmpty');

    container.innerHTML = '<tr><td colspan="6"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('enquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = data.map(enquiry => `
            <tr>
                <td>
                    <div class="table-name-cell">
                        <div>
                            <div class="name">${escapeHtml(enquiry.name)}</div>
                            <div class="sub">${escapeHtml(enquiry.email)}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(enquiry.phone)}</td>
                <td>${enquiry.package ? escapeHtml(enquiry.package) : '<span style="color:var(--admin-text-muted)">—</span>'}</td>
                <td><span class="status-badge ${enquiry.status}">${enquiry.status}</span></td>
                <td>${formatDate(enquiry.created_at)}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="viewEnquiry('${enquiry.id}')" title="View details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn" onclick="updateEnquiryStatus('${enquiry.id}', 'read')" title="Mark as read">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn" onclick="updateEnquiryStatus('${enquiry.id}', 'replied')" title="Mark as replied">
                            <i class="fas fa-reply"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteEnquiry('${enquiry.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Load enquiries error:', err);
        container.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--admin-danger)">Failed to load enquiries</td></tr>';
    }
}

async function viewEnquiry(id) {
    try {
        const { data, error } = await supabaseClient.from('enquiries').select('*').eq('id', id).single();
        if (error) throw error;

        const detailHtml = `
            <div class="detail-row"><div class="detail-label">Name</div><div class="detail-value">${escapeHtml(data.name)}</div></div>
            <div class="detail-row"><div class="detail-label">Email</div><div class="detail-value"><a href="mailto:${escapeHtml(data.email)}" style="color:var(--admin-primary)">${escapeHtml(data.email)}</a></div></div>
            <div class="detail-row"><div class="detail-label">Phone</div><div class="detail-value"><a href="tel:${escapeHtml(data.phone)}" style="color:var(--admin-primary)">${escapeHtml(data.phone)}</a></div></div>
            <div class="detail-row"><div class="detail-label">Package</div><div class="detail-value">${data.package || '—'}</div></div>
            <div class="detail-row"><div class="detail-label">Travelers</div><div class="detail-value">${data.travelers || '—'}</div></div>
            <div class="detail-row"><div class="detail-label">Travel Date</div><div class="detail-value">${data.travel_date || '—'}</div></div>
            <div class="detail-row"><div class="detail-label">Message</div><div class="detail-value">${escapeHtml(data.message)}</div></div>
            <div class="detail-row"><div class="detail-label">Status</div><div class="detail-value"><span class="status-badge ${data.status}">${data.status}</span></div></div>
            <div class="detail-row"><div class="detail-label">Submitted</div><div class="detail-value">${formatDate(data.created_at)}</div></div>
        `;

        document.getElementById('enquiryDetailContent').innerHTML = detailHtml;
        document.getElementById('enquiryModal').classList.add('active');

        // Mark as read if new
        if (data.status === 'new') {
            await supabaseClient.from('enquiries').update({ status: 'read' }).eq('id', id);
            loadEnquiries();
            loadDashboard();
        }
    } catch (err) {
        showToast('Failed to load enquiry details', 'error');
    }
}

async function updateEnquiryStatus(id, status) {
    try {
        const { error } = await supabaseClient.from('enquiries').update({ status }).eq('id', id);
        if (error) throw error;
        showToast(`Enquiry marked as ${status}`, 'success');
        loadEnquiries();
        loadDashboard();
    } catch (err) {
        showToast('Failed to update status', 'error');
    }
}

async function deleteEnquiry(id) {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    try {
        const { error } = await supabaseClient.from('enquiries').delete().eq('id', id);
        if (error) throw error;
        showToast('Enquiry deleted', 'success');
        loadEnquiries();
        loadDashboard();
    } catch (err) {
        showToast('Failed to delete enquiry', 'error');
    }
}

// ---- TESTIMONIALS ----
async function loadTestimonials() {
    const container = document.getElementById('testimonialsTableBody');
    const emptyState = document.getElementById('testimonialsEmpty');

    container.innerHTML = '<tr><td colspan="5"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('testimonials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = data.map(t => `
            <tr>
                <td>
                    <div class="table-name-cell">
                        <img src="${t.photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(t.customer_name) + '&background=f97316&color=fff'}" 
                             alt="${escapeHtml(t.customer_name)}" class="table-img" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(t.customer_name)}&background=f97316&color=fff'">
                        <div>
                            <div class="name">${escapeHtml(t.customer_name)}</div>
                            <div class="sub">${escapeHtml(t.location)}</div>
                        </div>
                    </div>
                </td>
                <td><div class="rating-stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div></td>
                <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(t.review)}</td>
                <td>${t.is_featured ? '<i class="fas fa-star" style="color:var(--admin-warning)"></i>' : ''}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="editTestimonial('${t.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteTestimonial('${t.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Load testimonials error:', err);
        container.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--admin-danger)">Failed to load testimonials</td></tr>';
    }
}

function openTestimonialModal(editId = null) {
    currentEditId = editId;
    currentEditType = 'testimonial';
    const modal = document.getElementById('testimonialFormModal');
    const title = modal.querySelector('.modal-header h3');

    if (editId) {
        title.textContent = 'Edit Testimonial';
        loadTestimonialForEdit(editId);
    } else {
        title.textContent = 'Add Testimonial';
        document.getElementById('testimonialForm').reset();
        const preview = document.getElementById('testimonialPhotoPreview');
        preview.classList.remove('visible');
        const fileInput = document.getElementById('tPhotoFile');
        if (fileInput) fileInput.value = '';
        const status = document.getElementById('testimonialUploadStatus');
        if (status) { status.className = 'upload-status'; status.textContent = ''; }
    }

    modal.classList.add('active');
}

async function loadTestimonialForEdit(id) {
    try {
        const { data, error } = await supabaseClient.from('testimonials').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('tCustomerName').value = data.customer_name;
        document.getElementById('tLocation').value = data.location;
        document.getElementById('tRating').value = data.rating;
        document.getElementById('tReview').value = data.review;
        document.getElementById('tPhotoUrl').value = data.photo_url || '';
        document.getElementById('tFeatured').checked = data.is_featured;

        if (data.photo_url) {
            const preview = document.getElementById('testimonialPhotoPreview');
            preview.src = data.photo_url;
            preview.classList.add('visible');
        }
    } catch (err) {
        showToast('Failed to load testimonial', 'error');
    }
}

async function editTestimonial(id) {
    openTestimonialModal(id);
}

async function saveTestimonial(e) {
    e.preventDefault();

    // Upload file if selected
    const fileInput = document.getElementById('tPhotoFile');
    if (fileInput && fileInput.files.length > 0) {
        const url = await uploadFileToStorage(fileInput.files[0], 'testimonials', 'testimonialUploadStatus');
        if (url) document.getElementById('tPhotoUrl').value = url;
    }

    const testimonial = {
        customer_name: document.getElementById('tCustomerName').value,
        location: document.getElementById('tLocation').value,
        rating: parseInt(document.getElementById('tRating').value),
        review: document.getElementById('tReview').value,
        photo_url: document.getElementById('tPhotoUrl').value || null,
        is_featured: document.getElementById('tFeatured').checked
    };

    try {
        let error;
        if (currentEditId) {
            ({ error } = await supabaseClient.from('testimonials').update(testimonial).eq('id', currentEditId));
        } else {
            ({ error } = await supabaseClient.from('testimonials').insert([testimonial]));
        }

        if (error) throw error;

        showToast(currentEditId ? 'Testimonial updated!' : 'Testimonial added!', 'success');
        closeAllModals();
        loadTestimonials();
        loadDashboard();
    } catch (err) {
        showToast('Failed to save testimonial: ' + err.message, 'error');
    }
}

async function deleteTestimonial(id) {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
        const { error } = await supabaseClient.from('testimonials').delete().eq('id', id);
        if (error) throw error;
        showToast('Testimonial deleted', 'success');
        loadTestimonials();
        loadDashboard();
    } catch (err) {
        showToast('Failed to delete testimonial', 'error');
    }
}

// ---- PACKAGES ----
async function loadPackages() {
    const container = document.getElementById('packagesTableBody');
    const emptyState = document.getElementById('packagesEmpty');

    container.innerHTML = '<tr><td colspan="5"><div class="loading-spinner"><div class="spinner"></div></div></td></tr>';

    try {
        const { data, error } = await supabaseClient
            .from('packages')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = data.map(p => `
            <tr>
                <td>
                    <div class="table-name-cell">
                        <img src="${p.image_url || 'https://placehold.co/100x100/1e293b/64748b?text=No+Image'}" 
                             alt="${escapeHtml(p.title)}" class="table-img"
                             onerror="this.src='https://placehold.co/100x100/1e293b/64748b?text=No+Image'">
                        <div>
                            <div class="name">${escapeHtml(p.title)}</div>
                            <div class="sub">${p.badge || ''}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(p.duration)}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(p.route)}</td>
                <td>${p.is_active ? '<span class="status-badge replied">Active</span>' : '<span class="status-badge read">Inactive</span>'}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="editPackage('${p.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deletePackage('${p.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Load packages error:', err);
        container.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--admin-danger)">Failed to load packages</td></tr>';
    }
}

function openPackageModal(editId = null) {
    currentEditId = editId;
    currentEditType = 'package';
    packageHighlights = [];
    const modal = document.getElementById('packageFormModal');
    const title = modal.querySelector('.modal-header h3');

    if (editId) {
        title.textContent = 'Edit Package';
        loadPackageForEdit(editId);
    } else {
        title.textContent = 'Add Package';
        document.getElementById('packageForm').reset();
        const preview = document.getElementById('packageImgPreview');
        preview.classList.remove('visible');
        const fileInput = document.getElementById('pImageFile');
        if (fileInput) fileInput.value = '';
        const status = document.getElementById('packageUploadStatus');
        if (status) { status.className = 'upload-status'; status.textContent = ''; }
        renderHighlights();
    }

    modal.classList.add('active');
}

async function loadPackageForEdit(id) {
    try {
        const { data, error } = await supabaseClient.from('packages').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('pTitle').value = data.title;
        document.getElementById('pTagline').value = data.tagline || '';
        document.getElementById('pDescription').value = data.description;
        document.getElementById('pDuration').value = data.duration;
        document.getElementById('pRoute').value = data.route;
        document.getElementById('pMinPersons').value = data.min_persons;
        document.getElementById('pBadge').value = data.badge || '';
        document.getElementById('pImageUrl').value = data.image_url || '';
        document.getElementById('pSortOrder').value = data.sort_order;
        document.getElementById('pActive').checked = data.is_active;
        packageHighlights = data.highlights || [];
        renderHighlights();

        if (data.image_url) {
            const preview = document.getElementById('packageImgPreview');
            preview.src = data.image_url;
            preview.classList.add('visible');
        }
    } catch (err) {
        showToast('Failed to load package', 'error');
    }
}

async function editPackage(id) {
    openPackageModal(id);
}

function addHighlight() {
    const input = document.getElementById('highlightInput');
    const value = input.value.trim();
    if (value) {
        packageHighlights.push(value);
        renderHighlights();
        input.value = '';
        input.focus();
    }
}

function removeHighlight(index) {
    packageHighlights.splice(index, 1);
    renderHighlights();
}

function renderHighlights() {
    const list = document.getElementById('highlightsList');
    if (!list) return;
    list.innerHTML = packageHighlights.map((h, i) => `
        <li>
            <span><i class="fas fa-check" style="color:var(--admin-success);margin-right:8px"></i>${escapeHtml(h)}</span>
            <button type="button" onclick="removeHighlight(${i})"><i class="fas fa-times"></i></button>
        </li>
    `).join('');
}

async function savePackage(e) {
    e.preventDefault();

    // Upload file if selected
    const fileInput = document.getElementById('pImageFile');
    if (fileInput && fileInput.files.length > 0) {
        const url = await uploadFileToStorage(fileInput.files[0], 'packages', 'packageUploadStatus');
        if (url) document.getElementById('pImageUrl').value = url;
    }

    const pkg = {
        title: document.getElementById('pTitle').value,
        tagline: document.getElementById('pTagline').value || null,
        description: document.getElementById('pDescription').value,
        duration: document.getElementById('pDuration').value,
        route: document.getElementById('pRoute').value,
        min_persons: parseInt(document.getElementById('pMinPersons').value) || 2,
        badge: document.getElementById('pBadge').value || null,
        image_url: document.getElementById('pImageUrl').value || null,
        highlights: packageHighlights,
        sort_order: parseInt(document.getElementById('pSortOrder').value) || 0,
        is_active: document.getElementById('pActive').checked,
        updated_at: new Date().toISOString()
    };

    try {
        let error;
        if (currentEditId) {
            ({ error } = await supabaseClient.from('packages').update(pkg).eq('id', currentEditId));
        } else {
            ({ error } = await supabaseClient.from('packages').insert([pkg]));
        }

        if (error) throw error;

        showToast(currentEditId ? 'Package updated!' : 'Package added!', 'success');
        closeAllModals();
        loadPackages();
        loadDashboard();
    } catch (err) {
        showToast('Failed to save package: ' + err.message, 'error');
    }
}

async function deletePackage(id) {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
        const { error } = await supabaseClient.from('packages').delete().eq('id', id);
        if (error) throw error;
        showToast('Package deleted', 'success');
        loadPackages();
        loadDashboard();
    } catch (err) {
        showToast('Failed to delete package', 'error');
    }
}

// ---- SEARCH ----
function searchTable(tableBodyId, query) {
    const rows = document.querySelectorAll(`#${tableBodyId} tr`);
    const q = query.toLowerCase();
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

// ---- MODALS ----
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    currentEditId = null;
    currentEditType = null;
}

// ---- TOAST ----
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ---- FILE UPLOAD (Supabase Storage) ----
async function uploadFileToStorage(file, folder, statusElId) {
    const statusEl = document.getElementById(statusElId);

    // Validate
    if (file.size > 5 * 1024 * 1024) {
        if (statusEl) { statusEl.className = 'upload-status error'; statusEl.textContent = 'File too large (max 5MB)'; }
        showToast('File too large. Max 5MB.', 'error');
        return null;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
        if (statusEl) { statusEl.className = 'upload-status error'; statusEl.textContent = 'Invalid file type'; }
        showToast('Only JPG, PNG, WebP, GIF allowed.', 'error');
        return null;
    }

    // Generate unique filename
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    if (statusEl) { statusEl.className = 'upload-status uploading'; statusEl.textContent = 'Uploading...'; }

    try {
        const { data, error } = await supabaseClient.storage
            .from('photos')
            .upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabaseClient.storage.from('photos').getPublicUrl(filename);
        const publicUrl = urlData.publicUrl;

        if (statusEl) { statusEl.className = 'upload-status success'; statusEl.textContent = 'Uploaded successfully!'; }
        showToast('Photo uploaded!', 'success');
        return publicUrl;
    } catch (err) {
        console.error('Upload error:', err);
        if (statusEl) { statusEl.className = 'upload-status error'; statusEl.textContent = 'Upload failed: ' + err.message; }
        showToast('Upload failed: ' + err.message, 'error');
        return null;
    }
}

function previewUpload(input, previewId, urlInputId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.classList.add('visible');
            // Clear URL input since file is selected
            document.getElementById(urlInputId).value = '';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ---- UTILITIES ----
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
