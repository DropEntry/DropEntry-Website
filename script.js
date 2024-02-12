document.addEventListener('DOMContentLoaded', function() {
    const checkboxes = document.querySelectorAll('.policy-checkbox');
    const submitButton = document.getElementById('policySubmit');
  
    const toggleSubmitButtonState = () => {
        const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
        submitButton.disabled = !allChecked;
    };
  
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', toggleSubmitButtonState);
    });
});
  