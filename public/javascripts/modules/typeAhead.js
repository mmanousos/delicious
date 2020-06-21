import axios from "axios";
import dompurify from "dompurify";

function searchResultsHTML(stores) {
  return stores
    .map((store) => {
      return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>`;
    })
    .join("");
}

function typeAhead(search) {
  if (!search) return; // return if there is no search
  const searchInput = search.querySelector('input[name="search"]'); // find the search input field
  const searchResults = search.querySelector(".search__results"); // find the div with `search__results` class

  searchInput.on("input", function () {
    // if there is no value
    if (!this.value) {
      searchResults.style.display = "none"; // hide the search results div
      return;
    }

    searchResults.style.display = "block"; // otherwise display the results as a block element
    searchResults.innerHTML = ""; // remove the contents of the block if there become no matches (e.g. through deleting search characters)

    // use axios to query the database using the API `search` endpoint
    // if the search term matches any entries, display them
    axios
      .get(`/api/search?q=${this.value}`)
      .then((res) => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(
            searchResultsHTML(res.data)
          );
          return;
        }
        // tell them nothing came back
        searchResults.innerHTML = dompurify.sanitize(
          `<div class="search__result">No results found for "${this.value}"!</div>`
        );
      })
      .catch((err) => {
        console.error(err);
      });
  });

  // handle keyboard inputs
  searchInput.on("keyup", (e) => {
    // 38 = up; 40 = down; 13 = enter

    // if not pressing up, down, or enter, skip it
    if (![38, 40, 13].includes(e.keyCode)) return;

    // add/remove `active` class for the current element
    // assign the `active` class to a variable for easy add / remove
    const activeClass = "search__result--active";
    // look for the elements with the active class
    const current = search.querySelector(`.${activeClass}`);
    // get the items within the search results
    const items = search.querySelectorAll(".search__result");
    // define a next variable as a pointer
    let next;

    // if press down and there is already one selected
    // set next to the next sibling of the current or the first result item
    // if there isn't already one selected, go to the first or last item
    // if one is selected and enter is pressed, go to that page
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0]; // first item if there isn't already one selected
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      // redirect to the selected entry if enter is pressed
      window.location = current.href;
      return; // stop the function after loading the new page
    }

    // to display which is currently active
    // remove active class from `current` and add it to `next`
    if (current) current.classList.remove(activeClass);
    next.classList.add(activeClass);
  });
}

export default typeAhead;
