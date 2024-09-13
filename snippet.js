function getQuerySelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  const path = [];
  while (element.parentElement) {
    const selector = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentElement.children).filter(
      sibling => sibling.tagName === element.tagName
    );
    if (siblings.length > 1) {
      const index = siblings.indexOf(element);
      path.unshift(`${selector}:nth-of-type(${index + 1})`);
    } else {
      path.unshift(selector);
    }
    element = element.parentElement;
  }
  return path.join(' > ');
}

function saveContent(querySelector, content, url) {
  fetch('http://localhost:4999/save_content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      querySelector: querySelector,
      content: content,
      url: url
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to save content');
      }
      return response.json();
    })
    .then(data => {
      console.log("Content saved:", data);
    })
    .catch(error => {
      console.error('Error saving content:', error);
    });
}

function applySavedContent() {
  const url = window.location.href;
  document.querySelectorAll('*').forEach(element => {
    const querySelector = getQuerySelector(element);
    fetch('http://localhost:4999/get_saved_content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        querySelector: querySelector,
        url: url
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to retrieve saved content');
        }
        return response.json();
      })
      .then(data => {
        const savedContent = data.content;
        if (savedContent) {
          if (savedContent.startsWith('<')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(savedContent, 'text/html');
            const newElement = doc.body.firstChild;
            element.replaceWith(newElement);
          } else {
            element.textContent = savedContent;
          }
        }
      })
      .catch(error => {
        console.error('Error applying saved content:', error);
      });
  });
}

(function () {
  let userId = localStorage.getItem("user_id");
  if (!userId) {
    userId = Date.now().toString();
    localStorage.setItem("user_id", userId);
  }
  console.log("User ID:", userId);

  applySavedContent();

  document.addEventListener('click', function (event) {
    const clickedElement = event.target;
    const querySelector = getQuerySelector(clickedElement);
    const originalText = clickedElement.textContent;

    fetch(`http://localhost:4999/get_variant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to get variant');
        }
        return response.json();
      })
      .then(data => {
        const variant = data.variant;
        console.log("Data from get_variant:", data);
        console.log("Variant:", variant);

        if (variant === "B") {
          console.log("Variant B detected, proceeding with rephrase");

          fetch('http://localhost:4999/rephrase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              querySelector: querySelector,
              content: originalText
            })
          })
            .then(response => {
              if (!response.ok) {
                throw new Error('Failed to rephrase content');
              }
              return response.json();
            })
            .then(data => {
              const rephrasedText = data.personalisedContent;
              const elementToReplace = document.querySelector(data.querySelector);

              if (elementToReplace) {
                if (typeof rephrasedText === 'string') {
                  console.log("Updating text content with:", rephrasedText);
                  elementToReplace.textContent = rephrasedText;
                  saveContent(data.querySelector, rephrasedText, window.location.href);
                } else if (rephrasedText instanceof HTMLElement) {
                  console.log("Replacing element with:", rephrasedText.outerHTML);
                  elementToReplace.replaceWith(rephrasedText);
                  saveContent(data.querySelector, rephrasedText.outerHTML, window.location.href);
                } else {
                  console.error("Unexpected type of rephrasedText:", typeof rephrasedText);
                }
              } else {
                console.error("Element not found with the provided querySelector");
              }
            })
            .catch(error => {
              console.error('Error during rephrasing:', error);
            });
        } else {
          console.log("Variant is not B:", variant);
        }
      })
      .catch(error => {
        console.error('Error getting variant:', error);
      });
  });
})();
