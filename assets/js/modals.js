// ===== MODALS & UI UTILITIES =====

// ===== ACCESSIBLE FORM NOTIFICATIONS (ARIA-LIVE) =====
let notificationTimeout = null;

function showNotification(message, type = 'success') {
    const notification = document.getElementById('formNotification');
    if (!notification) return;

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    notification.classList.remove('visible', 'success', 'error');
    notification.textContent = message;
    notification.classList.add(type);

    void notification.offsetWidth;

    notification.classList.add('visible');

    notificationTimeout = setTimeout(() => {
        notification.classList.remove('visible');
    }, 5000);
}

// ===== FOCUS TRAPPING FOR ACCESSIBILITY =====
let lastFocusedElement = null;
let currentTrapModal = null;

function getFocusableElements(container) {
    const focusableSelectors = [
        'button:not([disabled])',
        'a[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    return Array.from(container.querySelectorAll(focusableSelectors));
}

function trapFocus(e) {
    if (e.key !== 'Tab' || !currentTrapModal) return;

    const focusable = getFocusableElements(currentTrapModal);
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
    }
}

function enableFocusTrap(modal) {
    lastFocusedElement = document.activeElement;
    currentTrapModal = modal;

    const closeBtn = modal.querySelector('.modal-close');
    const focusable = getFocusableElements(modal);

    setTimeout(() => {
        if (closeBtn) {
            closeBtn.focus();
        } else if (focusable.length > 0) {
            focusable[0].focus();
        }
    }, 50);

    document.addEventListener('keydown', trapFocus);
}

function disableFocusTrap() {
    document.removeEventListener('keydown', trapFocus);
    currentTrapModal = null;

    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

// ===== MODAL OPEN/CLOSE =====
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    enableFocusTrap(modal);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    disableFocusTrap();
}

// Handle Escape key to close modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            closeModal(activeModal.id);
        }
    }
});
