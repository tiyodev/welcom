const SECOND = 1000,
    MINUTE = 60 * SECOND,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR,
    WEEK = 7 * DAY,
    YEAR = DAY * 365,
    MONTH = YEAR / 12;

const formats = [
  [ 0.7 * MINUTE, 'just now' ],
  [ 1.5 * MINUTE, 'a minute ago' ],
  [ 60 * MINUTE, 'minutes ago', MINUTE ],
  [ 1.5 * HOUR, 'an hour ago' ],
  [ DAY, 'hours ago', HOUR ],
  [ 2 * DAY, 'yesterday' ],
  [ 7 * DAY, 'days ago', DAY ],
  [ 1.5 * WEEK, 'a week ago'],
  [ MONTH, 'weeks ago', WEEK ],
  [ 1.5 * MONTH, 'a month ago' ],
  [ YEAR, 'months ago', MONTH ],
  [ 1.5 * YEAR, 'a year ago' ],
  [ Number.MAX_VALUE, 'years ago', YEAR ]
];

/*
 * @function
 * @name relativeDate
 * @desc Define a relative date between a given date and a reference date.
 * @param {Date} givenDate - Given date
 * @param {Date} referenceDate - Reference date. If reference date is null, we will take the current date as a reference.
 */
function relativeDate(givenDate, referenceDate) {
  if(referenceDate === undefined || referenceDate === null)
    referenceDate = new Date(Date.now());

  if(referenceDate instanceof Date)
    referenceDate = referenceDate.getTime();
  else
    return 'Error in reference date!';

  if(givenDate instanceof Date)
    givenDate = givenDate.getTime();
  else
    return 'Error in the given date!';

  const delta = referenceDate - givenDate;
  let format, i, len;

  for(i = -1, len=formats.length; ++i < len; ){
    format = formats[i];
    if(delta < format[0]){
      return format[2] == undefined ? format[1] : Math.round(delta/format[2]) + ' ' + format[1];
    }
  };
}

/*
 * @function
 * @name counterChar
 * @desc Character counter for text boxes.
 * @param {string} textarea - Id of the text area
 * @param {string} display - Id of the container of counter display text
 * @param {int} min - Number min of character of the textarea
 * @param {int} max - Number max of character of the textarea
 */
function counterChar(textarea, display, min, max) {
  const textareaElem = document.getElementById(textarea);
  const displayElem = document.getElementById(display);

  if (textareaElem === undefined || displayElem === undefined) 
    displayElem.innerText = 'Error';

  if(textareaElem.value.length < min){
    displayElem.innerText = `${textareaElem.value.length} (min signs: ${min})`;
    displayElem.classList.remove('text-success');
    displayElem.classList.add('text-danger');
  }
  else if(textareaElem.value.length > max){
    displayElem.innerText = `${textareaElem.value.length} (max signs: ${max})`;
    displayElem.classList.remove('text-success');
    displayElem.classList.add('text-danger');
  }
  else{
    displayElem.innerText = textareaElem.value.length;
    displayElem.classList.remove('text-danger');
    displayElem.classList.add('text-success');
  }
}

/*
 * @function
 * @name initCounterChar
 * @desc Init the character counter for text boxes.
 * @param {string} textarea - Id of the text area
 * @param {string} display - Id of the container of counter display text
 * @param {int} min - Number min of character of the textarea
 * @param {int} max - Number max of character of the textarea
 */
function initCounterChar(textarea, display, min, max) {
  counterChar(textarea, display, min, max);
}