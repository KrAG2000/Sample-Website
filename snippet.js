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

(function () {
  let userId = localStorage.getItem("user_id");
  if (!userId) {
    userId = Date.now().toString();
    localStorage.setItem("user_id", userId);
  }
  console.log("User ID:", userId);

  document.addEventListener('click', function (event) {
    const clickedElement = event.target;
    const querySelector = getQuerySelector(clickedElement);
    const originalText = clickedElement.textContent;

    fetch(`http://localhost:4999/get_variant?user_id=${userId}`)
      .then(response => {
        console.log("Response from get_variant:", response);
        return response.json();
      })
      .then(data => {
        const variant = data.variant;
        console.log("Data from get_variant:", data);
        console.log("Variant:", variant);

        if (variant === "B") {
          console.log("Variant B detected, proceeding with rephrase");

          fetch('http://localhost:5000/rephrase', {
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
            console.log("Response from rephrase:", response);
            return response.json();
          })
          .then(data => {
            const rephrasedText = data.personalisedContent;
            const elementToReplace = document.querySelector(data.querySelector);

            if (elementToReplace) {
              if (typeof rephrasedText === 'string') {
                console.log("Updating text content with:", rephrasedText);
                elementToReplace.textContent = rephrasedText;
              } else if (rephrasedText instanceof HTMLElement) {
                console.log("Replacing element with:", rephrasedText.outerHTML);
                elementToReplace.replaceWith(rephrasedText);
              } else {
                console.error("Unexpected type of rephrasedText:", typeof rephrasedText);
              }
            } else {
              console.error("Element not found with the provided querySelector");
            }
          });
        } else {
          console.log("Variant is not B:", variant);
        }
      });
  });
})();
