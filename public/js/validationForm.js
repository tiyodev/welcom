function createInvalideFeedback(id, msg) {
  if (document.getElementById(id) === undefined || document.getElementById(id) === null) {
    console.error('Id not found');
    return;
  }

  const invalideDiv = document.createElement('div');
  invalideDiv.classList.add('invalid-feedback');
  const invalideSpan = document.createElement('span');
  invalideSpan.append(msg);
  invalideDiv.append(invalideSpan);

  document.getElementById(id).parentNode.append(invalideDiv);
}

function checkServerValidity(errors) {
  if (errors) {
    errors.forEach((error) => {
      const input = document.getElementsByName(error.param)[0];
      if (input) {
        input.classList.add('is-invalid');
        input.value = error.value;
      }
    });
  }
}

function setServerValidData(validData) {
  if (validData) {
    for (const key in validData) {
      const input = document.getElementsByName(key)[0];
      if (input.classList.contains('selectpicker')) {
        $(`.selectpicker[name=${key}]`).selectpicker('val', validData[key]);
      } else if (input.type === 'date') {
        input.valueAsDate = new Date(validData[key]);
      } else {
        input.value = validData[key];
      }
    }
  }
}
