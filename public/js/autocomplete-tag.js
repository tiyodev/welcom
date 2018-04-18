function deleteTag(evt) {
  // Remove parentNode
  if (this.parentNode) {
    this.parentNode.parentNode.removeChild(this.parentNode);
  } else if (evt) {
    evt.parentNode.parentNode.removeChild(evt.parentNode);
  } else {
    console.error('impossible to delete tag');
  }
}

function appendTagInDOM(name) {
  const containers = document.getElementById('tags-container');

  const flexItem = document.createElement('div');
  flexItem.classList.add('mr-2', 'tags-item', 'border', 'border-danger', 'rounded');

  const tagsDeleteBtn = document.createElement('button');
  tagsDeleteBtn.setAttribute('type', 'button');
  tagsDeleteBtn.classList.add('btn', 'btn-danger');
  tagsDeleteBtn.onclick = deleteTag;

  const tagsDeleteBtnIcn = document.createElement('span');
  tagsDeleteBtnIcn.classList.add('fas', 'fa-trash-alt');

  const tagsName = document.createElement('span');
  tagsName.classList.add('pl-3', 'pr-3', 'tags-item-value');
  tagsName.innerText = name;

  const tagsInputHidden = document.createElement('input');
  tagsInputHidden.setAttribute('type', 'hidden');
  tagsInputHidden.setAttribute('name', 'tags[]');
  tagsInputHidden.setAttribute('value', name);
  tagsInputHidden.setAttribute('data-id', '');

  tagsDeleteBtn.appendChild(tagsDeleteBtnIcn);
  flexItem.appendChild(tagsDeleteBtn);
  flexItem.appendChild(tagsName);
  flexItem.appendChild(tagsInputHidden);
  containers.appendChild(flexItem);
}

function appendTagErrorInDOM(field, msg) {
  // Create DOM
  createInvalideFeedback(field, msg);

  // Set invalid input
  const input = $(`#${field}`)[0];
  if (input) {
    input.classList.add('is-invalid');
  }
}

function createTagsItem(name, field, conf) {
  // Get all tags in an array
  const tagsItemsValue = [...document.getElementsByClassName('tags-item-value')];

  // Test if the tags already exists
  if (tagsItemsValue.some(x => x.innerText === name)) {
    appendTagErrorInDOM(field, 'Tags already exists!');
    return;
  }

  // Test if the limit is OK
  if (tagsItemsValue.length >= conf.limit) {
    appendTagErrorInDOM(field, `Please choose maximum ${conf.limit} tags!`);
    return;
  }

  // Test if the name is empty
  if (!name) {
    appendTagErrorInDOM(field, 'Tags can\'t be empty!');
    return;
  }

  // Create Tags DOM
  appendTagInDOM(name);
}

function autocomplete_tag(field, conf) {
  if (conf.btnId) {
    // Set action in button +
    $(`#${conf.btnId}`).click(() => {
      const input = document.getElementById(field);
      if (input) {
        // Create tag
        createTagsItem(input.value, field, conf);
        // Initialize tags input
        input.value = '';
      }
    });
  }

  $(`#${field}`).autocomplete({
    source(request, response) {
      $.ajax({
        url: '/tags/autocomplete',
        dataType: 'jsonp',
        data: {
          term: request.term
        },
        success(data) {
          console.log(data);
          response($.map(data, item => ({
            label: item.name
          })));
        },
        error(err) {
          console.error(err);
          response();
        }
      });
    },
    minLength: 0,
    autoFocus: true,
    select(event, ui) {
      createTagsItem(ui.item.value, field, conf);
    },
    close(event, ui) {
      // Initialize tags input
      const tagsInput = document.getElementById('tags');
      tagsInput.value = '';
    }
  });
}
