function createInvalideFeedback(id, msg) {
  if (document.getElementById(id) === undefined || document.getElementById(id) === null) {
    console.error('Id not found');
    return;
  }

  const feedbackContainer = document.getElementById('tags').parentNode.querySelector('.invalid-feedback');

  if (feedbackContainer) {
    feedbackContainer.innerText = msg;
  } else {
    const invalideDiv = document.createElement('div');
    invalideDiv.classList.add('invalid-feedback');
    const invalideSpan = document.createElement('span');
    invalideSpan.append(msg);
    invalideDiv.append(invalideSpan);

    document.getElementById(id).parentNode.append(invalideDiv);
  }
}

function addErrorInForm(errors, errorContainerId){
  // Set only the first error message
  if(errors && errors.length > 0){
    let element = document.getElementsByName(errors[0].param)[0];
    if (element) {
      element.classList.add('is-invalid');
      element.value = errors[0].value || '';

      let invalidMsgContainer = document.getElementById(errorContainerId);
      if(invalidMsgContainer){
        invalidMsgContainer.firstChild.innerText = errors[0].msg;
      }
    }
  }
}

function checkServerValidity(errors) {
  if (errors) {
    errors.forEach((error) => {
      const input = document.getElementsByName(error.param)[0];

      if (input !== undefined) {
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
          if (document.getElementById(invalidContainerAttr).firstChild !== undefined) {
            document.getElementById(invalidContainerAttr).firstChild.innerText = error.msg;
          }
        } else if (invalidContainerAttr && (input.checkValidity() && allDependentInputIsValid)) {
          document.getElementById(invalidContainerAttr).style.display = 'none';
        }

        if (input) {
          input.classList.add('is-invalid');
          input.value = error.value;
        }
      }
    });
  }
}

function setServerValidData(validData) {
  if (validData) {
    for (const key in validData) {
      const input = document.getElementsByName(key)[0];
      if (key === 'tags') {
        const input = document.getElementsByName(key)[0];
        input.classList.add('is-valid');

        if (validData[key] !== undefined) {
          validData[key].forEach((item) => {
            if (item !== undefined && item !== null && item !== '') { appendTagInDOM(item); }
          });
        }
      } else if (input.classList.contains('selectpicker')) {
        $(`.selectpicker[name=${key}]`).selectpicker('val', validData[key]);
        // Add is valid class
        input.classList.add('is-valid');
      } else if (input.type === 'radio') {
        // input.checked = validData[key];
        document.querySelector(`input[name="${key}"][value="${validData[key]}"]`).checked = true;
        // Add is valid class
        document.querySelectorAll(`input[name="${key}"]`).forEach(elem => elem.classList.add('is-valid'));
      } else if (input.type === 'date') {
        input.valueAsDate = new Date(validData[key]);
        // Add is valid class
        input.classList.add('is-valid');
      } else {
        input.value = validData[key];
        // Add is valid class
        input.classList.add('is-valid');
      }
    }
  }
}
