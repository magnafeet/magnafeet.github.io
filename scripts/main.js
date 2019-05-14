var myImage = document.querySelector('img');

myImage.onclick = function() {
    var mySrc = myImage.getAttribute('src');
    if(mySrc === 'images/lucky-buddha.jpg') {
      myImage.setAttribute ('src','images/angry-buddha.jpg');
    } else {
      myImage.setAttribute ('src','images/lucky-buddha.jpg');
    }
}

var myButton = document.querySelector('button');
var myHeading = document.querySelector('h1');

function setUserName() {
  var myName = prompt('Please enter your name.');
  localStorage.setItem('name', myName);
  myHeading.textContent = 'Buddha is cool, ' + myName;
}

if(!localStorage.getItem('name')) {
  setUserName();
} else {
  var storedName = localStorage.getItem('name');
  myHeading.textContent = 'Buddha is cool, ' + storedName;
}

myButton.onclick = function() {
  setUserName();
}