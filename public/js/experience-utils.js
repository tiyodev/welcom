function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

function setInvalidInput(input) {
  if (input !== undefined && input !== null) {
    if (input.name === 'tags') {
      if (document.querySelectorAll('input[name="tags[]"]') == null || document.querySelectorAll('input[name="tags[]"]').length === 0) {
        input.setCustomValidity('invalid');
      } else {
        input.setCustomValidity('');
      }
    } else if (input.type === 'radio' && document.querySelector(`input[name="${input.name}"]:checked`) == null) {
      input.setCustomValidity('invalid');
    } else if (input.type === 'radio') {
      document.querySelectorAll(`input[name="${input.name}"]`).forEach((item) => {
        item.setCustomValidity('');
        if (item.classList.contains('is-invalid')) {
          item.classList.add('is-valid');
          item.classList.remove('is-invalid');
        }
      });
    }
    if (input.type === 'number' && (input.value === '0' || isBlank(input.value))) {
      input.setCustomValidity('invalid');
    } else if (input.type === 'number') {
      input.setCustomValidity('');
      if (input.classList.contains('is-invalid')) {
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
      }
    }
    if (input.type === 'textarea' && isBlank(input.value)) {
      input.setCustomValidity('invalid');
    } else if (input.type === 'textarea') {
      input.setCustomValidity('');
      if (input.classList.contains('is-invalid')) {
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
      }
    }

    // Test if all dependent input are valid
    let allDependentInputIsValid = true;
    if (input.getAttribute('data-invalid-dependent')) {
      const invalidContainerDependent = input.getAttribute('data-invalid-dependent').split(',');
      if (invalidContainerDependent !== undefined && invalidContainerDependent !== null) {
        let i = 0;
        for (i = 0; i < invalidContainerDependent.length; i++) {
          if (!document.getElementById(invalidContainerDependent[i]).checkValidity()) {
            allDependentInputIsValid = false;
          }
        }
      }
    }

    // Test is a specific error container is defined
    const invalidContainerAttr = input.getAttribute('data-invalid-container');
    if (invalidContainerAttr && !(input.checkValidity() && allDependentInputIsValid)) {
      document.getElementById(invalidContainerAttr).style.display = 'block';
    } else if (invalidContainerAttr && (input.checkValidity() && allDependentInputIsValid)) {
      document.getElementById(invalidContainerAttr).style.display = 'none';
    }
  }
}

function disabledInput(input) {
  if (input) { input.disabled = true; }
}

function enabledInput(input) {
  if (input) { input.disabled = false; }
}

function resetInputValue(input) {
  if (input && input.type === 'radio') {
    input.checked = false;
  } else if (input && input.type === 'number') {
    input.value = 0;
  } else if (input && input.type === 'textarea') {
    input.value = null;
  } else if (input) { input.value = null; }
}

function expFreeChanged(value, ...inputs) {
  if (value === 'true') {
    inputs.forEach(elem => disabledInput(elem));
    inputs.forEach(elem => resetInputValue(elem));
    inputs.forEach(elem => setInvalidInput(elem));
  } else {
    inputs.forEach(elem => enabledInput(elem));
  }
}

function checkValidityExpCharge(value, ...inputs) {
  if (value === 'false') {
    inputs.forEach(elem => setInvalidInput(elem));
  }
}

