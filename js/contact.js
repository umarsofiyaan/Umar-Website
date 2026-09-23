document.addEventListener('DOMContentLoaded', () => {
    // Fade in animation on load
    const mainContent = document.getElementById('main-content');
    setTimeout(() => {
        mainContent.classList.add('loaded');
    }, 100);

    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const successState = document.getElementById('success-state');
    const globalError = document.getElementById('global-error');

    // Validation functions
    const isEmailValid = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const validateField = (input) => {
        const formGroup = input.closest('.form-group');
        let isValid = true;

        if (!input.value.trim()) {
            isValid = false;
        } else if (input.type === 'email' && !isEmailValid(input.value)) {
            isValid = false;
        }

        if (isValid) {
            formGroup.classList.remove('error');
        } else {
            formGroup.classList.add('error');
        }

        return isValid;
    };

    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.closest('.form-group').classList.contains('error')) {
                validateField(input);
            }
        });
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide global error on new attempt
        globalError.classList.remove('active');

        // Validate all fields
        let isFormValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) return;

        // Set loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const formData = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Show success state
                form.style.display = 'none';
                successState.classList.add('active');
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            globalError.classList.add('active');
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
});
