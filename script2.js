const handleNavbarVisibility = () => {

    const navbar = document.querySelector('.navigation-bar');

    window.addEventListener("scroll", function() {
        let currentScroll = document.documentElement.scrollTop  || document.body.scrollTop;

        if (currentScroll <= 0) {
            navbar.classList.add("navigation-bar-top");
        } else {
            navbar.classList.remove("navigation-bar-top");
        }
    }, false);

    /*
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navigation-bar');

    window.addEventListener("scroll", function() {
        let currentScroll = document.documentElement.scrollTop  || document.body.scrollTop;

        if (currentScroll <= 0) {
            navbar.style.top = '0rem';
            navbar.classList.add("navigation-bar-top");

        } else if (currentScroll >= lastScrollTop){
            navbar.style.top = `-${navbar.offsetHeight}rem`;
          
        } else {
            console.log("hello");
            navbar.style.top = '0rem';
            navbar.classList.remove("navigation-bar-top");

        }

        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }, true);
    */
}

handleNavbarVisibility();

/*


const handleNavbarVisibility = () => {
    let lastScrollTop = 0;
    let scrollUpStart = 0;
    const navbar = document.querySelector('.navigation-bar');
    const section1 = document.getElementById("section1");

    window.addEventListener("scroll", function() {
        let currentScroll = document.documentElement.scrollTop  || document.body.scrollTop;
        
        if (currentScroll <= 0) {
            navbar.style.position = "absolute";
            navbar.style.top = '0px';
            navbar.classList.add("navigation-bar-top");
            scrollUpStart = 0;
            section1.style.marginTop = "0px";

        } else if (currentScroll >= lastScrollTop){
            navbar.style.position = "absolute";
            section1.style.marginTop = "0px";
            scrollUpStart = 0;
        } else {
            if (scrollUpStart === 0) {


                
                scrollUpStart = currentScroll;
                navbar.style.top = `${currentScroll - getVisibleHeight(navbar)}px`; 
                navbar.classList.remove("navigation-bar-top");
            }
            if (scrollUpStart - currentScroll > navbar.offsetHeight) {
                navbar.style.position = "sticky";
                section1.style.marginTop = `${-navbar.offsetHeight}px`;
                navbar.style.top = "0px";
            }
        }
        
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }, true);

}

function getVisibleHeight(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
  
    // Check if the element is out of view
    if (rect.bottom < 0 || rect.top > windowHeight) {
      return 0; // The element is out of view
    }
  
    // Calculate visible parts
    const visibleTop = rect.top < 0 ? 0 : rect.top;
    const visibleBottom = rect.bottom > windowHeight ? windowHeight : rect.bottom;
  
    return visibleBottom - visibleTop;
  }

handleNavbarVisibility();*/


let featureUpdated = false;

const featuresItems = document.querySelectorAll(".features-item");
for (const featuresItem of featuresItems) {
    featuresItem.addEventListener("click", () => {
        featureUpdated = true;
        document.querySelector(".features-icon-selected").classList.remove("features-icon-selected");
        document.querySelector(".features-item-selected").classList.remove("features-item-selected");
        featuresItem.classList.add("features-item-selected");
        featuresItem.querySelector(".features-icon").classList.add("features-icon-selected");
    });
}

const getNextElement = (currentElement) => {
    let nextElement = currentElement.nextElementSibling;
    if (!nextElement) {
        nextElement = currentElement.parentNode.firstElementChild;
    }
    return nextElement;
}

setInterval(() => {
    if (!featureUpdated) {
        const selectedElement = document.querySelector(".features-item-selected");
        document.querySelector(".features-icon-selected").classList.remove("features-icon-selected");
        selectedElement.classList.remove("features-item-selected");
        const nextElement = getNextElement(selectedElement);
        nextElement.classList.add("features-item-selected");
        nextElement.querySelector(".features-icon").classList.add("features-icon-selected");
    } else {
        featureUpdated = false;
    }
}, 6000);



const boxes = document.querySelector(".boxes");

boxes.addEventListener('scroll', () => {
    const scrollAmount = boxes.scrollLeft;
    const maxScrollDepth = boxes.scrollWidth - boxes.clientWidth;
    const navDivs = document.querySelectorAll(".navigation div");
    const selectedIndex = Math.floor(scrollAmount/maxScrollDepth*4);
    console.log(selectedIndex);
    for (let i = 0; i < navDivs.length; i++) { // Use a traditional for loop
        if (i == selectedIndex || selectedIndex >= 4 && i === 3) {
            navDivs[i].classList.add("selectedNav"); // Add to the selected index
        } else {
            navDivs[i].classList.remove("selectedNav"); // Remove from the others
        }
    }

});
