let modal = null
let modalIsOpen = false

//modal will autoplay the open animation on display being changed
function openModal() {
  modal.style.display = "block"
}


//add the hide class to play it's animation
function closeModal() {
  modal.classList.add("hide")
}

function toggleModal() {
  if (modalIsOpen) {
    closeModal()
  }
  else {
    openModal()
  }
}


//look in the options form, find all inputs and outputs
//in labels and bind the input event on the input
//to update the output
function bindOutputs() {
  const labels = Array.from(document.optionsForm.children)
                      .filter(c => c.tagName == "LABEL")
  
  for (const label of labels) {
    const children = Array.from(label.children)
    const input = children.filter(c => c.tagName == "INPUT")[0]
    const output = children.filter(c => c.tagName == "OUTPUT")[0]

    if (input && output) {
      //set the initial value
      output.defaultValue = input.defaultValue
      output.value = input.value

      //bind the event
      input.oninput = () => {
        output.value = input.value
      }
    }
  }
}

window.onload = () => {
  modal = document.getElementById("optionsModal")

  //remove the hide class and remove from page
  //this means that when display is changed, animation
  //will be the open one, not the one from hide
  modal.addEventListener("animationend", () => {
    if (modalIsOpen) {
      modal.classList.remove("hide")
      modal.style.display = "none"
    }

    modalIsOpen = !modalIsOpen
  })

  bindOutputs()

  const splitAngleToggle = document.optionsForm.randomiseSplitAngle
  const maxSplitAngle = document.optionsForm.maxSplitAngle
  
  //set default and change on event
  maxSplitAngle.disabled = !splitAngleToggle.checked
  splitAngleToggle.oninput = () => {
    maxSplitAngle.disabled = !splitAngleToggle.checked
  }
}


window.onclick = event => {
  if (event.target == modal) {
    closeModal()
  }
}


document.addEventListener("keypress", event => {
  if (event.key.toLowerCase() == 'e') {
    toggleModal()
  }
})