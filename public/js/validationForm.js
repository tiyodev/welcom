function isValidMandatoryString(value) {
  if (value === '') { return false; }
  return true;
}

function isValidEmail(value) {
  const emailRegex = /^(([a-zA-Z]|[0-9])|([-]|[_]|[.]))+[@](([a-zA-Z0-9])|([-])){2,63}[.](([a-zA-Z0-9]){2,63})+$/;
  if (emailRegex.test(value)) { return true; }
  return false;
}

function checkSignUpForm() {
  let isValid = true;
  const form = $('form[name="signupForm"]')[0];

  if (isValidMandatoryString(form.email.value)) {
    if (isValidEmail(form.email.value)) {
      $('#email_err')[0].innerHTML = '';
    } else {
      isValid = false;
      $('#email_err')[0].innerHTML = "L'email n'est pas au bon format.";
    }
  } else {
    isValid = false;
    $('#email_err')[0].innerHTML = 'Email est obligatoire.';
  }

  if (isValidMandatoryString(form.password.value)) {
    $('#password_err')[0].innerHTML = '';
  } else {
    isValid = false;
    $('#password_err')[0].innerHTML = 'Password est obligatoire.';
  }
  return isValid;
}
