// function getQuerySelector(element) {
//     if (element.id) {
//       return `#${element.id}`;
//     }
//     const path = [];
//     while (element.parentElement) {
//       const selector = element.tagName.toLowerCase();
//       const siblings = Array.from(element.parentElement.children).filter(
//         sibling => sibling.tagName === element.tagName
//       );
//       if (siblings.length > 1) {
//         const index = siblings.indexOf(element);
//         path.unshift(`${selector}:nth-of-type(${index + 1})`);
//       } else {
//         path.unshift(selector);
//       }
//       element = element.parentElement;
//     }
//     return path.join(' > ');
//   }

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

  document.addEventListener('click', function (event) {
    const clickedElement = event.target;
    const querySelector = getQuerySelector(clickedElement);
    const originalText = clickedElement.textContent;

    fetch(`http://localhost:5000/get_variant?user_id=${userId}`)
      .then(response => response.json())
      .then(data => {
        const variant = data.variant;

        if (variant === "B") {
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
            .then(response => response.json())
            .then(data => {
              const rephrasedText = data.rephrased_content;
              clickedElement.textContent = rephrasedText;
            });
        }
      });
  });
})();
