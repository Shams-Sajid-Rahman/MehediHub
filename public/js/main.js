// MehediHub Client-side JS

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.alert.alert-dismissible');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) bsAlert.close();
    }, 5000);
  });

  // Role card selection
  document.querySelectorAll('.role-radio').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
      radio.nextElementSibling.classList.add('selected');
    });
    // Restore selection on page load
    if (radio.checked) {
      radio.nextElementSibling.classList.add('selected');
    }
  });

  // Confirm delete buttons
  document.querySelectorAll('[data-confirm]').forEach(btn => {
    btn.addEventListener('click', e => {
      if (!confirm(btn.dataset.confirm || 'Are you sure?')) {
        e.preventDefault();
      }
    });
  });

  // Image preview on file input
  document.querySelectorAll('input[type="file"][data-preview]').forEach(input => {
    input.addEventListener('change', () => {
      const previewId = input.dataset.preview;
      const preview = document.getElementById(previewId);
      if (preview && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => { preview.src = e.target.result; };
        reader.readAsDataURL(input.files[0]);
      }
    });
  });

  // NID file input — show file name
  document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', () => {
      const label = input.nextElementSibling;
      if (label && label.tagName === 'LABEL') {
        label.textContent = input.files[0]?.name || 'Choose file';
      }
    });
  });
});

// Cart counter update (called after cart changes)
function updateCartBadge(count) {
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline' : 'none';
  });
}
